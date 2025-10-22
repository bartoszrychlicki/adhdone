import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import {
  assertFamilyAccess,
  assertParentOrAdmin,
  requireAuthContext
} from "../../../_lib/authContext"
import { handleRouteError } from "../../../_lib/errors"
import { parseFamilyUpdatePayload } from "../../../_validators/family"
import { updateFamily } from "../../../_services/familiesService"
import { ensureUuid } from "../../../_lib/validation"
import { readJsonBody } from "../../../_lib/request"

type RouteParams = {
  params: Promise<{
    familyId: string
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

    const { familyId } = await context.params
    const familyIdValidated = ensureUuid(familyId, "familyId")
    assertFamilyAccess(authContext, familyIdValidated)

    const payload = await readJsonBody(request)
    const command = parseFamilyUpdatePayload(payload)

    const family = await updateFamily(supabase, familyIdValidated, command)

    return NextResponse.json(family, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}
