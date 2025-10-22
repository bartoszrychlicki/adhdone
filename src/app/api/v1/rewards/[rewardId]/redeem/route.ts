import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { requireAuthContext } from "../../../../_lib/authContext"
import { ForbiddenError, handleRouteError, mapSupabaseError } from "../../../../_lib/errors"
import { ensureUuid } from "../../../../_lib/validation"
import { readJsonBody } from "../../../../_lib/request"
import { parseRedeemPayload } from "../../../../_validators/reward"
import { createRewardRedemption } from "../../../../_services/rewardRedemptionService"
import { ensureProfileInFamily } from "../../../../_services/profilesService"

async function ensureRewardFamily(
  rewardIdValidated: string,
  familyId: string
): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("rewards")
    .select("family_id")
    .eq("id", rewardIdValidated)
    .maybeSingle()

  if (error) {
    throw mapSupabaseError(error)
  }

  if (!data || data.family_id !== familyId) {
    throw new ForbiddenError("Reward does not belong to this family")
  }
}

type RouteParams = {
  params: Promise<{
    rewardId: string
  }>
}

export async function POST(
  request: NextRequest,
  context: RouteParams
): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient()

    const authContext = await requireAuthContext(supabase)
    const familyId = authContext.familyId
    if (!familyId) {
      throw new ForbiddenError("Profile not associated with family")
    }

    const { rewardId } = await context.params
    const rewardIdValidated = ensureUuid(rewardId, "rewardId")
    const payload = await readJsonBody(request)
    const command = parseRedeemPayload(payload)

    if (
      authContext.role === "child" &&
      authContext.profileId !== command.childProfileId
    ) {
      throw new ForbiddenError("Children can only redeem for themselves")
    }
    await ensureRewardFamily(rewardIdValidated, familyId)
    await ensureProfileInFamily(supabase, command.childProfileId, familyId)

    const redemption = await createRewardRedemption(
      supabase,
      rewardIdValidated,
      familyId,
      command
    )

    return NextResponse.json(redemption, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
