import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { requireAuthContext } from "../../../../../_lib/authContext"
import {
  ForbiddenError,
  handleRouteError
} from "../../../../../_lib/errors"
import { ensureUuid } from "../../../../../_lib/validation"
import { ensureProfileInFamily } from "../../../../../_services/profilesService"
import { listRoutinePerformance } from "../../../../../_services/performanceService"

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
      throw new ForbiddenError("Children can only view their own stats")
    }

    await ensureProfileInFamily(supabase, childIdValidated, authContext.familyId)

    const routineId = request.nextUrl.searchParams.get("routineId") ?? undefined
    const stats = await listRoutinePerformance(supabase, childIdValidated, routineId)

    return NextResponse.json(stats, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}
