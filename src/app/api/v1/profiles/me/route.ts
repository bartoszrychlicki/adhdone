import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { handleRouteError } from "../../../_lib/errors"
import { requireAuthContext } from "../../../_lib/authContext"
import { getProfileById } from "../../../_services/profilesService"

export async function GET(): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient()
    const context = await requireAuthContext(supabase)

    const profile = await getProfileById(supabase, context.profileId)

    return NextResponse.json(profile, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}
