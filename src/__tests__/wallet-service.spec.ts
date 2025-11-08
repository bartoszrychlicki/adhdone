import { describe, expect, it } from "vitest"

import { getChildWallet } from "@/app/api/_services/walletService"

type SupabaseResponse = {
  data?: unknown
  error?: { message: string } | null
}

function createSupabaseStub(responses: Record<string, SupabaseResponse[]>): Record<string, unknown> {
  const queues = new Map<string, SupabaseResponse[]>(Object.entries(responses))

  const buildResponse = (table: string) => {
    const queue = queues.get(table) ?? []
    const payload = queue.shift() ?? { data: null, error: null }
    queues.set(table, queue)
    return payload
  }

  const createBuilder = (table: string) => {
    const builder: Record<string, any> = {
      select() {
        return builder
      },
      eq() {
        return builder
      },
      order() {
        return builder
      },
      limit() {
        return builder
      },
      in() {
        return builder
      },
      maybeSingle() {
        return Promise.resolve(buildResponse(table))
      },
      then(onFulfilled: (value: SupabaseResponse) => void, onRejected?: (reason: unknown) => void) {
        return Promise.resolve(buildResponse(table)).then(onFulfilled, onRejected)
      },
    }
    return builder
  }

  return {
    from(table: string) {
      return createBuilder(table)
    },
  }
}

describe("getChildWallet", () => {
  it("aggregates balance, recent transactions and pending rewards", async () => {
    const supabase = createSupabaseStub({
      point_transactions: [
        {
          data: [
            { points_delta: 20 },
            { points_delta: -5 },
            { points_delta: 15 },
          ],
          error: null,
        },
        {
          data: [
            {
              id: "tx-1",
              transaction_type: "task_completion",
              points_delta: 20,
              created_at: "2025-01-01T08:00:00Z",
            },
            {
              id: "tx-2",
              transaction_type: "routine_bonus",
              points_delta: 15,
              created_at: "2025-01-01T09:00:00Z",
            },
          ],
          error: null,
        },
      ],
      reward_redemptions: [
        {
          data: [
            { id: "reward-1", points_cost: 40, status: "pending" },
            { id: "reward-2", points_cost: 25, status: "approved" },
          ],
          error: null,
        },
      ],
    }) as never

    const wallet = await getChildWallet(supabase, "family-1", "child-1", 5)

    expect(wallet.balance).toBe(30)
    expect(wallet.recentTransactions).toHaveLength(2)
    expect(wallet.recentTransactions[0]).toMatchObject({
      id: "tx-1",
      transactionType: "task_completion",
    })
    expect(wallet.pendingRedemptions).toEqual([
      { rewardRedemptionId: "reward-1", pointsCost: 40, status: "pending" },
      { rewardRedemptionId: "reward-2", pointsCost: 25, status: "approved" },
    ])
  })

  it("returns zeroed snapshot when no data exists", async () => {
    const supabase = createSupabaseStub({
      point_transactions: [
        { data: [], error: null },
        { data: [], error: null },
      ],
      reward_redemptions: [{ data: [], error: null }],
    }) as never

    const wallet = await getChildWallet(supabase, "family-1", "child-1", 3)

    expect(wallet.balance).toBe(0)
    expect(wallet.recentTransactions).toEqual([])
    expect(wallet.pendingRedemptions).toEqual([])
  })
})
