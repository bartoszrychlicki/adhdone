import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { requireAuthContext } from "../../../../_lib/authContext"
import {
  ForbiddenError,
  handleRouteError
} from "../../../../_lib/errors"
import { ensureUuid } from "../../../../_lib/validation"
import { parseWalletQuery } from "../../../../_validators/points"
import { ensureProfileInFamily } from "../../../../_services/profilesService"
import { getChildWallet } from "../../../../_services/walletService"

type RouteParams = {
  params: Promise<{
    childId: string
  }>
}

export async function GET(
  request: NextRequest,
  context: RouteParams
): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient()
    const authContext = await requireAuthContext(supabase)
    const { childId } = await context.params
    const childIdValidated = ensureUuid(childId, "childId")

    if (!authContext.familyId) {
      throw new ForbiddenError("Profile not associated with family")
    }

    if (authContext.role === "child" && authContext.profileId !== childIdValidated) {
      throw new ForbiddenError("Children can only view their own wallet")
    }

    await ensureProfileInFamily(supabase, childIdValidated, authContext.familyId)

    const query = parseWalletQuery(request.nextUrl.searchParams)
    const wallet = await getChildWallet(
      supabase,
      authContext.familyId,
      childIdValidated,
      query.transactionsLimit
    )

    if (!query.includeTransactions) {
      wallet.recentTransactions = []
    }

    return NextResponse.json(wallet, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}
