import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import {
  assertParentOrAdmin,
  requireAuthContext
} from "../../../_lib/authContext"
import { handleRouteError, ForbiddenError, mapSupabaseError } from "../../../_lib/errors"
import { ensureUuid } from "../../../_lib/validation"
import { readJsonBody } from "../../../_lib/request"
import { parseUpdateRewardPayload } from "../../../_validators/reward"
import {
  archiveReward,
  getRewardDetails,
  updateReward
} from "../../../_services/rewardsService"

async function ensureRewardBelongsToFamily(
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

export async function GET(
  _request: NextRequest,
  context: RouteParams
): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient()

    const authContext = await requireAuthContext(supabase)
    assertParentOrAdmin(authContext)

    const { rewardId } = await context.params
    const rewardIdValidated = ensureUuid(rewardId, "rewardId")
    const familyId = authContext.familyId
    if (!familyId) {
      throw new ForbiddenError("Profile not associated with family")
    }

    await ensureRewardBelongsToFamily(rewardIdValidated, familyId)
    const details = await getRewardDetails(supabase, rewardIdValidated)

    return NextResponse.json(details, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteParams
): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient()

    const authContext = await requireAuthContext(supabase)
    assertParentOrAdmin(authContext)

    const { rewardId } = await context.params
    const rewardIdValidated = ensureUuid(rewardId, "rewardId")
    const familyId = authContext.familyId
    if (!familyId) {
      throw new ForbiddenError("Profile not associated with family")
    }

    await ensureRewardBelongsToFamily(rewardIdValidated, familyId)

    const payload = await readJsonBody(request)
    const command = parseUpdateRewardPayload(payload)
    const reward = await updateReward(supabase, rewardIdValidated, command)

    return NextResponse.json(reward, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteParams
): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient()

    const authContext = await requireAuthContext(supabase)
    assertParentOrAdmin(authContext)

    const { rewardId } = await context.params
    const rewardIdValidated = ensureUuid(rewardId, "rewardId")
    const familyId = authContext.familyId
    if (!familyId) {
      throw new ForbiddenError("Profile not associated with family")
    }

    await ensureRewardBelongsToFamily(rewardIdValidated, familyId)
    const result = await archiveReward(supabase, rewardIdValidated)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}
