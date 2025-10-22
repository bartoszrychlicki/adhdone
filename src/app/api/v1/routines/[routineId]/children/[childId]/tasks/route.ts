import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import {
  assertParentOrAdmin,
  requireAuthContext
} from "../../../../../../_lib/authContext"
import {
  ForbiddenError,
  handleRouteError
} from "../../../../../../_lib/errors"
import { ensureUuid } from "../../../../../../_lib/validation"
import { readJsonBody } from "../../../../../../_lib/request"
import {
  parseTaskCreatePayload,
  parseTaskListQuery
} from "../../../../../../_validators/routine"
import { ensureRoutineInFamily } from "../../../../../../_services/routinesService"
import {
  assertChildAssignedToRoutine
} from "../../../../../../_services/childRoutinesService"
import {
  createRoutineTask,
  listRoutineTasks
} from "../../../../../../_services/routineTasksService"
import { ensureProfileInFamily } from "../../../../../../_services/profilesService"

type RouteParams = {
  params: Promise<{
    routineId: string
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
    assertParentOrAdmin(authContext)

    if (!authContext.familyId) {
      throw new ForbiddenError("Profile not associated with family")
    }

    const { routineId } = await context.params
    const routineIdValidated = ensureUuid(routineId, "routineId")
    const { childId } = await context.params
    const childIdValidated = ensureUuid(childId, "childId")
    await ensureRoutineInFamily(supabase, routineIdValidated, authContext.familyId)
    await ensureProfileInFamily(supabase, childIdValidated, authContext.familyId)
    await assertChildAssignedToRoutine(supabase, routineIdValidated, childIdValidated)

    const query = parseTaskListQuery(request.nextUrl.searchParams)
    const tasks = await listRoutineTasks(supabase, routineIdValidated, childIdValidated, {
      includeInactive: query.includeInactive,
      sort: query.sort,
      order: query.order
    })

    return NextResponse.json(tasks, { status: 200 })
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
    assertParentOrAdmin(authContext)

    if (!authContext.familyId) {
      throw new ForbiddenError("Profile not associated with family")
    }

    const { routineId } = await context.params
    const routineIdValidated = ensureUuid(routineId, "routineId")
    const { childId } = await context.params
    const childIdValidated = ensureUuid(childId, "childId")

    const payload = await readJsonBody(request)
    const command = parseTaskCreatePayload(payload)
    await ensureRoutineInFamily(supabase, routineIdValidated, authContext.familyId)
    await ensureProfileInFamily(supabase, childIdValidated, authContext.familyId)
    await assertChildAssignedToRoutine(supabase, routineIdValidated, childIdValidated)

    const task = await createRoutineTask(supabase, routineIdValidated, childIdValidated, command)
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
