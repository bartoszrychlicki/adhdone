import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { requireAuthContext } from "../../../../_lib/authContext"
import { ensureUuid } from "../../../../_lib/validation"
import { ForbiddenError, handleRouteError } from "../../../../_lib/errors"
import { readJsonBody } from "../../../../_lib/request"
import {
  parseProfilePinPayload
} from "../../../../_validators/profile"
import {
  ensureProfileInFamily,
  updateProfilePin
} from "../../../../_services/profilesService"

type RouteParams = {
  params: Promise<{
    profileId: string
  }>
}

export async function POST(
  request: NextRequest,
  context: RouteParams
): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient()

    const authContext = await requireAuthContext(supabase)
    const { profileId } = await context.params
    const profileIdValidated = ensureUuid(profileId, "profileId")

    const payload = await readJsonBody(request)
    const command = parseProfilePinPayload(payload)

    if (!authContext.familyId) {
      throw new ForbiddenError("Profile not associated with family")
    }
    await ensureProfileInFamily(supabase, profileIdValidated, authContext.familyId)

    const result = await updateProfilePin(supabase, authContext, profileIdValidated, command)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}
