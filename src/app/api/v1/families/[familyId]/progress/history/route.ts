import { NextResponse, type NextRequest } from "next/server"
import {
  assertFamilyAccess,
  assertParentOrAdmin,
  requireAuthContext
} from "../../../../../_lib/authContext"
import { createSupabaseServerClient } from "@/lib/supabase"
import { handleRouteError } from "../../../../../_lib/errors"
import { ensureUuid } from "../../../../../_lib/validation"
import { parseFamilyProgressHistoryQuery } from "../../../../../_validators/progress"
import { getFamilyProgressHistory } from "../../../../../_services/familyProgressService"

type RouteParams = {
  params: Promise<{
    familyId: string
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

    const { familyId } = await context.params
    const familyIdValidated = ensureUuid(familyId, "familyId")
    assertFamilyAccess(authContext, familyIdValidated)

    const query = parseFamilyProgressHistoryQuery(request.nextUrl.searchParams)

    const history = await getFamilyProgressHistory(supabase, familyIdValidated, {
      page: query.page,
      pageSize: query.pageSize,
      fromDate: query.fromDate,
      toDate: query.toDate
    })

    return NextResponse.json(history, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}
