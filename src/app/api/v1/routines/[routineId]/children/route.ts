import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import {
  assertParentOrAdmin,
  requireAuthContext
} from "../../../../_lib/authContext"
import {
  ForbiddenError,
  handleRouteError
} from "../../../../_lib/errors"
import { ensureUuid, parseBoolean } from "../../../../_lib/validation"
import { ensureRoutineInFamily } from "../../../../_services/routinesService"
import { listChildAssignments } from "../../../../_services/childRoutinesService"

type RouteParams = {
  params: Promise<{
    routineId: string
  }>
}

export async function GET(
  request: NextRequest,
  context: RouteParams
): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient()

    const authContext = await requireAuthContext(supabase)
    assertParentOrAdmin(authContext)

    if (!authContext.familyId) {
      throw new ForbiddenError("Profile not associated with family")
    }

    const { routineId } = await context.params
    const routineIdValidated = ensureUuid(routineId, "routineId")
    await ensureRoutineInFamily(supabase, routineIdValidated, authContext.familyId)

    const includeDisabled = parseBoolean(
      request.nextUrl.searchParams.get("includeDisabled"),
      false
    )

    const assignments = await listChildAssignments(
      supabase,
      routineIdValidated,
      includeDisabled
    )

    return NextResponse.json(assignments, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}
