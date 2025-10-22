import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { requireAuthContext } from "../../../_lib/authContext"
import {
  ForbiddenError,
  handleRouteError
} from "../../../_lib/errors"
import { ensureUuid } from "../../../_lib/validation"
import {
  parseProfileUpdatePayload
} from "../../../_validators/profile"
import {
  ensureProfileInFamily,
  getProfileById,
  updateProfile
} from "../../../_services/profilesService"
import { readJsonBody } from "../../../_lib/request"
import { hasActiveToken } from "../../../_services/tokensService"

type RouteParams = {
  params: Promise<{
    profileId: string
  }>
}

export async function PATCH(
  request: NextRequest,
  context: RouteParams
): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient()

    const authContext = await requireAuthContext(supabase)
    const { profileId } = await context.params
    const profileIdValidated = ensureUuid(profileId, "profileId")

    const payload = await readJsonBody(request)
    const command = parseProfileUpdatePayload(payload)

    if (!authContext.familyId) {
      throw new ForbiddenError("Profile is not associated with a family")
    }

    if (authContext.role === "child" && authContext.profileId !== profileIdValidated) {
      throw new ForbiddenError("Children can only update their own profile")
    }

    const targetProfile = await ensureProfileInFamily(
      supabase,
      profileIdValidated,
      authContext.familyId
    )

    if (
      authContext.role !== "parent" &&
      authContext.role !== "admin" &&
      authContext.profileId !== profileIdValidated
    ) {
      throw new ForbiddenError("Insufficient permissions to update profile")
    }

    if (targetProfile.role === "parent" && command.deletedAt) {
      throw new ForbiddenError("Parent profile cannot be soft deleted")
    }

    if (command.deletedAt) {
      const activeToken = await hasActiveToken(supabase, profileIdValidated)
      if (activeToken) {
        throw new ForbiddenError(
          "Cannot delete profile with active child access token"
        )
      }
    }

    await updateProfile(supabase, profileIdValidated, command)

    const updatedProfile = await getProfileById(supabase, profileIdValidated)
    return NextResponse.json(updatedProfile, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}
