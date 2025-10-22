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
import { parseChildRoutineReorderPayload } from "../../../../../_validators/routine"
import {
  ensureRoutineInFamily
} from "../../../../../_services/routinesService"
import {
  reorderChildRoutines
} from "../../../../../_services/childRoutinesService"

type RouteParams = {
  params: Promise<{
    routineId: string
  }>
}

export async function PATCH(
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

    const payload = await readJsonBody(request)
    const command = parseChildRoutineReorderPayload(payload)

    const result = await reorderChildRoutines(supabase, routineIdValidated, command)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}
