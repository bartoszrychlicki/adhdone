import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { requireAuthContext } from "../../../../_lib/authContext"
import { ForbiddenError, handleRouteError } from "../../../../_lib/errors"
import { ensureUuid } from "../../../../_lib/validation"
import { parseRewardRedemptionListQuery } from "../../../../_validators/reward"
import { ensureProfileInFamily } from "../../../../_services/profilesService"
import { listRewardRedemptions } from "../../../../_services/rewardRedemptionService"

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
      throw new ForbiddenError("Children can only view their own redemptions")
    }

    const query = parseRewardRedemptionListQuery(request.nextUrl.searchParams)
    const offset = (query.page - 1) * query.pageSize

    await ensureProfileInFamily(supabase, childIdValidated, authContext.familyId)

    const redemptions = await listRewardRedemptions(supabase, {
      childProfileId: childIdValidated,
      status: query.status,
      limit: query.pageSize,
      offset,
      sort: query.sort,
      order: query.order
    })

    return NextResponse.json(redemptions, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}
