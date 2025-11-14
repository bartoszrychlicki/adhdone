import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { assertParentOrAdmin, requireAuthContext } from "../../../../../_lib/authContext"
import { ForbiddenError, handleRouteError, mapSupabaseError } from "../../../../../_lib/errors"
import { ensureUuid } from "../../../../../_lib/validation"
import { readJsonBody } from "../../../../../_lib/request"
import { parseVisibilityPayload } from "../../../../../_validators/reward"
import {
  deleteRewardVisibility,
  upsertRewardVisibility
} from "../../../../../_services/rewardVisibilityService"
import { ensureProfileInFamily } from "../../../../../_services/profilesService"

async function ensureRewardFamily(
  rewardIdValidated: string,
  familyId: string
): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await (supabase as any)
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
    childId: string
  }>
}

export async function PUT(
  request: NextRequest,
  context: RouteParams
): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient()

    const authContext = await requireAuthContext(supabase)
    assertParentOrAdmin(authContext)

    const { rewardId } = await context.params
    const rewardIdValidated = ensureUuid(rewardId, "rewardId")
    const { childId } = await context.params
    const childIdValidated = ensureUuid(childId, "childId")
    const familyId = authContext.familyId
    if (!familyId) {
      throw new ForbiddenError("Profile not associated with family")
    }

    await ensureRewardFamily(rewardIdValidated, familyId)
    await ensureProfileInFamily(supabase, childIdValidated, familyId)

    const payload = await readJsonBody(request)
    const command = parseVisibilityPayload(payload)

    const visibility = await upsertRewardVisibility(
      supabase,
      rewardIdValidated,
      childIdValidated,
      command
    )

    return NextResponse.json(visibility, { status: 200 })
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
    const { childId } = await context.params
    const childIdValidated = ensureUuid(childId, "childId")
    const familyId = authContext.familyId
    if (!familyId) {
      throw new ForbiddenError("Profile not associated with family")
    }

    await ensureRewardFamily(rewardIdValidated, familyId)
    await ensureProfileInFamily(supabase, childIdValidated, familyId)

    const result = await deleteRewardVisibility(supabase, rewardIdValidated, childIdValidated)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}
