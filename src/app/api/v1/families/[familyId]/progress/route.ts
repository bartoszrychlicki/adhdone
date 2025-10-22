import { NextResponse, type NextRequest } from "next/server"
import { addDays } from "date-fns"
import { createSupabaseServerClient } from "@/lib/supabase"
import {
  assertFamilyAccess,
  assertParentOrAdmin,
  requireAuthContext
} from "../../../../_lib/authContext"
import { handleRouteError } from "../../../../_lib/errors"
import { ensureUuid } from "../../../../_lib/validation"
import { parseFamilyProgressQuery } from "../../../../_validators/progress"
import { getDailyFamilyProgress } from "../../../../_services/familyProgressService"

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

    const query = parseFamilyProgressQuery(request.nextUrl.searchParams)

    const current = await getDailyFamilyProgress(
      supabase,
      familyIdValidated,
      query.date
    )

    if (!query.includeHistory) {
      return NextResponse.json(current, { status: 200 })
    }

    const previousDate = addDays(new Date(`${query.date}T00:00:00Z`), -1)
    const previousSummary = await getDailyFamilyProgress(
      supabase,
      familyIdValidated,
      previousDate.toISOString().slice(0, 10)
    )

    return NextResponse.json(
      {
        ...current,
        history: {
          previousDay: previousSummary
        }
      },
      { status: 200 }
    )
  } catch (error) {
    return handleRouteError(error)
  }
}
