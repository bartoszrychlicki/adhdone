import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import {
  assertParentOrAdmin,
  requireAuthContext
} from "../../../../_lib/authContext"
import { handleRouteError, ForbiddenError } from "../../../../_lib/errors"
import { ensureUuid, parseBoolean } from "../../../../_lib/validation"
import { readJsonBody } from "../../../../_lib/request"
import {
  parseCreateChildTokenPayload
} from "../../../../_validators/profile"
import {
  createChildAccessToken,
  listChildAccessTokens
} from "../../../../_services/tokensService"
import { ensureProfileInFamily } from "../../../../_services/profilesService"

type RouteParams = {
  params: Promise<{
    profileId: string
  }>
}

export async function GET(
  request: NextRequest,
  context: RouteParams
): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient()

    const authContext = await requireAuthContext(supabase)
    const { profileId } = await context.params
    const profileIdValidated = ensureUuid(profileId, "profileId")

    if (!authContext.familyId) {
      throw new ForbiddenError("Profile not associated with family")
    }
    await ensureProfileInFamily(supabase, profileIdValidated, authContext.familyId)

    if (authContext.role === "child" && authContext.profileId !== profileIdValidated) {
      throw new ForbiddenError("Children can only view their own tokens")
    }

    const includeInactive = parseBoolean(
      request.nextUrl.searchParams.get("includeInactive"),
      false
    )

    const tokens = await listChildAccessTokens(
      supabase,
      profileIdValidated,
      includeInactive
    )

    return NextResponse.json(tokens, { status: 200 })
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

    const { profileId } = await context.params
    const profileIdValidated = ensureUuid(profileId, "profileId")

    if (!authContext.familyId) {
      throw new ForbiddenError("Profile not associated with family")
    }
    await ensureProfileInFamily(supabase, profileIdValidated, authContext.familyId)

    const payload = await readJsonBody(request)
    const command = parseCreateChildTokenPayload(payload)

    const token = await createChildAccessToken(
      supabase,
      profileIdValidated,
      authContext.profileId,
      command
    )

    return NextResponse.json(token, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
