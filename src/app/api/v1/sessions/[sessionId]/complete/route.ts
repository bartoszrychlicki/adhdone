import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase"
import { requireAuthContext } from "../../../../_lib/authContext"
import {
  ForbiddenError,
  handleRouteError
} from "../../../../_lib/errors"
import { ensureUuid } from "../../../../_lib/validation"
import { readJsonBody } from "../../../../_lib/request"
import { parseSessionCompletionPayload } from "../../../../_validators/session"
import { ensureProfileInFamily } from "../../../../_services/profilesService"
import {
  completeRoutineSession,
  getSessionDetails
} from "../../../../_services/routineSessionsService"

type RouteParams = {
  params: Promise<{
    sessionId: string
  }>
}

export async function POST(
  request: NextRequest,
  context: RouteParams
): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient()

    const authContext = await requireAuthContext(supabase)
    const dbClient =
      authContext.role === "child" ? createSupabaseServiceRoleClient() : supabase
    const { sessionId } = await context.params
    const sessionIdValidated = ensureUuid(sessionId, "sessionId")

    if (!authContext.familyId) {
      throw new ForbiddenError("Profile not associated with family")
    }
    const session = await getSessionDetails(dbClient, sessionIdValidated, {
      includeTasks: false,
      includePerformance: false
    })

    await ensureProfileInFamily(
      dbClient,
      session.childProfileId,
      authContext.familyId
    )

    if (
      authContext.role === "child" &&
      authContext.profileId !== session.childProfileId
    ) {
      throw new ForbiddenError("Children can only complete their own sessions")
    }

    const payload = await readJsonBody(request)
    const command = parseSessionCompletionPayload(payload)

    const result = await completeRoutineSession(
      dbClient,
      sessionIdValidated,
      command,
      authContext.profileId
    )

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}
