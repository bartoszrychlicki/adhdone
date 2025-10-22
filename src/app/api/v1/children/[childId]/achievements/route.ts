import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { requireAuthContext } from "../../../../_lib/authContext"
import { ForbiddenError, handleRouteError } from "../../../../_lib/errors"
import { ensureUuid } from "../../../../_lib/validation"
import { readJsonBody } from "../../../../_lib/request"
import { parseAwardAchievementPayload } from "../../../../_validators/reward"
import {
  awardAchievement,
  listChildAchievements
} from "../../../../_services/achievementsService"
import { ensureProfileInFamily } from "../../../../_services/profilesService"

type RouteParams = {
  params: Promise<{
    childId: string
  }>
}

export async function GET(
  _request: NextRequest,
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
      throw new ForbiddenError("Children can only view their own achievements")
    }

    await ensureProfileInFamily(supabase, childIdValidated, authContext.familyId)

    const achievements = await listChildAchievements(supabase, childIdValidated)
    return NextResponse.json(achievements, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(
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

    if (authContext.role === "child") {
      throw new ForbiddenError("Children cannot award achievements")
    }

    await ensureProfileInFamily(supabase, childIdValidated, authContext.familyId)

    const payload = await readJsonBody(request)
    const command = parseAwardAchievementPayload(payload)

    const result = await awardAchievement(supabase, childIdValidated, command)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
