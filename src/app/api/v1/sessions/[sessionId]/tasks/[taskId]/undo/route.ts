import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { requireAuthContext } from "../../../../../../_lib/authContext"
import {
  ForbiddenError,
  handleRouteError
} from "../../../../../../_lib/errors"
import { ensureUuid } from "../../../../../../_lib/validation"
import { ensureProfileInFamily } from "../../../../../../_services/profilesService"
import {
  getSessionDetails,
  undoTaskCompletion
} from "../../../../../../_services/routineSessionsService"

type RouteParams = {
  params: Promise<{
    sessionId: string
    taskId: string
  }>
}

export async function POST(
  _request: NextRequest,
  context: RouteParams
): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient()

    const authContext = await requireAuthContext(supabase)
    const { sessionId, taskId } = await context.params
    const sessionIdValidated = ensureUuid(sessionId, "sessionId")
    const completionId = ensureUuid(taskId, "taskCompletionId")

    if (!authContext.familyId) {
      throw new ForbiddenError("Profile not associated with family")
    }
    const session = await getSessionDetails(supabase, sessionIdValidated, {
      includeTasks: false,
      includePerformance: false
    })

    await ensureProfileInFamily(
      supabase,
      session.childProfileId,
      authContext.familyId
    )

    if (authContext.role === "child") {
      throw new ForbiddenError("Only parents can undo task completions")
    }

    await undoTaskCompletion(supabase, sessionIdValidated, completionId)

    return NextResponse.json(
      { message: "Task completion reverted" },
      { status: 200 }
    )
  } catch (error) {
    return handleRouteError(error)
  }
}
