import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import {
  assertParentOrAdmin,
  requireAuthContext
} from "../../../_lib/authContext"
import {
  ForbiddenError,
  handleRouteError
} from "../../../_lib/errors"
import { ensureUuid } from "../../../_lib/validation"
import { readJsonBody } from "../../../_lib/request"
import { parseTaskUpdatePayload } from "../../../_validators/routine"
import {
  ensureRoutineInFamily
} from "../../../_services/routinesService"
import {
  getRoutineTaskById,
  updateRoutineTask
} from "../../../_services/routineTasksService"

type RouteParams = {
  params: Promise<{
    taskId: string
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

    const { taskId } = await context.params
    const taskIdValidated = ensureUuid(taskId, "taskId")
    const payload = await readJsonBody(request)
    const command = parseTaskUpdatePayload(payload)
    const taskRow = await getRoutineTaskById(supabase, taskIdValidated)
    await ensureRoutineInFamily(supabase, taskRow.routine_id, authContext.familyId)

    const task = await updateRoutineTask(supabase, taskIdValidated, command)
    return NextResponse.json(task, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}
