import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import {
  assertParentOrAdmin,
  requireAuthContext
} from "../../../../../_lib/authContext"
import {
  ForbiddenError,
  handleRouteError
} from "../../../../../_lib/errors"
import { ensureUuid } from "../../../../../_lib/validation"
import { readJsonBody } from "../../../../../_lib/request"
import { parseChildRoutineAssignmentPayload } from "../../../../../_validators/routine"
import { ensureRoutineInFamily } from "../../../../../_services/routinesService"
import {
  upsertChildRoutine
} from "../../../../../_services/childRoutinesService"
import { ensureProfileInFamily } from "../../../../../_services/profilesService"

type RouteParams = {
  params: Promise<{
    routineId: string
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

    if (!authContext.familyId) {
      throw new ForbiddenError("Profile not associated with family")
    }

    const { routineId } = await context.params
    const routineIdValidated = ensureUuid(routineId, "routineId")
    const { childId } = await context.params
    const childIdValidated = ensureUuid(childId, "childId")

    const payload = await readJsonBody(request)
    const command = parseChildRoutineAssignmentPayload(payload)
    await ensureRoutineInFamily(supabase, routineIdValidated, authContext.familyId)
    await ensureProfileInFamily(supabase, childIdValidated, authContext.familyId)

    const assignment = await upsertChildRoutine(
      supabase,
      routineIdValidated,
      childIdValidated,
      command
    )

    return NextResponse.json(assignment, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}
