import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { assertParentOrAdmin, requireAuthContext } from "../../../../_lib/authContext"
import { ForbiddenError, handleRouteError, mapSupabaseError } from "../../../../_lib/errors"
import { ensureUuid } from "../../../../_lib/validation"
import { listRewardVisibility } from "../../../../_services/rewardVisibilityService"

type RouteParams = {
  params: Promise<{
    rewardId: string
  }>
}

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

    await ensureRewardFamily(rewardIdValidated, familyId)
    const visibility = await listRewardVisibility(supabase, rewardIdValidated)

    return NextResponse.json(visibility, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}
