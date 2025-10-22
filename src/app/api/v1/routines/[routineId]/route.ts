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
import { ensureUuid, parseBoolean } from "../../../_lib/validation"
import {
  getRoutineDetails,
  ensureRoutineInFamily,
  updateRoutine,
  archiveRoutine
} from "../../../_services/routinesService"
import { readJsonBody } from "../../../_lib/request"
import { parseRoutineUpdatePayload } from "../../../_validators/routine"

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
    if (!authContext.familyId) {
      throw new ForbiddenError("Profile not associated with family")
    }

    const { routineId } = await context.params
    const routineIdValidated = ensureUuid(routineId, "routineId")
    await ensureRoutineInFamily(supabase, routineIdValidated, authContext.familyId)

    const includeChildren = parseBoolean(
      request.nextUrl.searchParams.get("includeChildren"),
      false
    )

    const routine = await getRoutineDetails(supabase, routineIdValidated, {
      includeChildren
    })

    return NextResponse.json(routine, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
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
    const command = parseRoutineUpdatePayload(payload)

    const routine = await updateRoutine(supabase, routineIdValidated, command)
    return NextResponse.json(routine, { status: 200 })
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

    if (!authContext.familyId) {
      throw new ForbiddenError("Profile not associated with family")
    }

    const { routineId } = await context.params
    const routineIdValidated = ensureUuid(routineId, "routineId")
    await ensureRoutineInFamily(supabase, routineIdValidated, authContext.familyId)

    const result = await archiveRoutine(supabase, routineIdValidated)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}
