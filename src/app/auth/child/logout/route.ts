import { NextResponse } from "next/server"

import { clearChildSession } from "@/lib/auth/child-session"

export async function GET(request: Request): Promise<Response> {
  await clearChildSession()
  const url = new URL("/auth/child", request.url)
  return NextResponse.redirect(url)
}
