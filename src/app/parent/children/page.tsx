import { redirect } from "next/navigation"
import Link from "next/link"
import { QrCode } from "lucide-react"

import { generateTokenAction, deactivateTokenAction } from "./actions"
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase"
import { getActiveProfile } from "@/lib/auth/get-active-profile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString("pl-PL")
}

export default async function ParentChildrenPage() {
  const activeProfile = await getActiveProfile()
  if (!activeProfile) {
    redirect("/auth/parent")
  }

  if (!activeProfile.familyId) {
    throw new Error("Brak przypisanej rodziny.")
  }

  const supabase = await createSupabaseServerClient()
  const serviceClient = createSupabaseServiceRoleClient()

  const { data: children } = await supabase
    .from("profiles")
    .select("id, display_name, last_login_at, settings")
    .eq("family_id", activeProfile.familyId)
    .eq("role", "child")
    .is("deleted_at", null)
    .order("display_name", { ascending: true })

  const childIds = (children ?? []).map((child) => child.id)

  const { data: tokens } = childIds.length
    ? await serviceClient
        .from("child_access_tokens")
        .select("id, profile_id, token, created_at, last_used_at, deactivated_at")
        .in("profile_id", childIds)
        .order("created_at", { ascending: false })
    : { data: [] }

  const tokensByChild = new Map<string, typeof tokens>()
  if (tokens) {
    for (const token of tokens) {
      const list = tokensByChild.get(token.profile_id) ?? []
      list.push(token)
      tokensByChild.set(token.profile_id, list)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <Card className="border-slate-800/60 bg-slate-900/40 text-slate-100">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold">Profile dzieci</CardTitle>
            <CardDescription className="text-sm text-slate-200/80">
              Zarządzaj dostępem dzieci do aplikacji. Generuj tokeny logowania i monitoruj ostatnie użycia.
            </CardDescription>
          </div>
          <Button asChild variant="outline" className="border-slate-800/60 bg-slate-900/50 text-white">
            <Link href="/onboarding/family">Dodaj nowe dziecko</Link>
          </Button>
        </CardHeader>
      </Card>

      {children?.length === 0 ? (
        <Alert className="border-slate-800/60 bg-slate-900/40 text-slate-200/80">
          <AlertTitle>Brak dzieci w rodzinie</AlertTitle>
          <AlertDescription>Dodaj profil dziecka w kroku onboardingowym, aby zarządzać dostępem.</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4">
        {children?.map((child) => {
          const childTokens = tokensByChild.get(child.id) ?? []
          const activeToken = childTokens.find((token) => token.deactivated_at === null)

          const qrLink = activeToken
            ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activeToken.token)}`
            : null

          return (
            <Card key={child.id} className="border-slate-800/60 bg-slate-900/40 text-slate-100">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold">{child.display_name}</CardTitle>
                  <CardDescription className="text-sm text-slate-200/80">
                    Ostatnie logowanie: {formatDate(child.last_login_at)}
                  </CardDescription>
                </div>
                {activeToken ? (
                  <Badge variant="outline" className="border-emerald-400/60 text-emerald-200">
                    Token aktywny
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-slate-700/60 text-slate-300">
                    Brak aktywnego tokenu
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                  <div className="flex flex-col gap-3">
                    <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3 text-xs text-slate-200/80">
                      <p className="font-semibold text-white">Bieżący token:</p>
                      <p className="break-all text-sm text-teal-200/90">
                        {activeToken ? activeToken.token : "Brak aktywnego tokenu"}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {activeToken ? `Wygenerowany: ${formatDate(activeToken.created_at)}` : "Wygeneruj token, aby dziecko mogło się zalogować."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={generateTokenAction}>
                        <input type="hidden" name="childId" value={child.id} />
                        <Button type="submit" size="sm">
                          Wygeneruj nowy token
                        </Button>
                      </form>
                      {activeToken ? (
                        <form action={deactivateTokenAction}>
                          <input type="hidden" name="childId" value={child.id} />
                          <input type="hidden" name="tokenId" value={activeToken.id} />
                          <Button type="submit" size="sm" variant="outline">
                            Dezaktywuj token
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                  {qrLink ? (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-800/60 bg-slate-900/50 p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrLink} alt="Kod QR tokenu" className="h-32 w-32" />
                      <span className="text-xs text-slate-300/80">Zeskanuj, aby zalogować dziecko</span>
                    </div>
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-slate-800/60 bg-slate-900/50 text-xs text-slate-400">
                      <QrCode className="size-8" aria-hidden />
                    </div>
                  )}
                </div>

                {childTokens.length > 0 ? (
                  <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3 text-xs text-slate-200/80">
                    <p className="font-semibold mb-2 text-white">Historia tokenów</p>
                    <ul className="space-y-1">
                      {childTokens.slice(0, 5).map((token) => (
                        <li key={token.id} className="flex flex-wrap gap-2 text-slate-300/90">
                          <span className="font-mono text-xs">{token.token}</span>
                          <span className="text-slate-500">| wygenerowano: {formatDate(token.created_at)}</span>
                          <span className="text-slate-500">| ostatnie użycie: {formatDate(token.last_used_at)}</span>
                          {token.deactivated_at ? (
                            <span className="text-slate-500">| dezaktywowany: {formatDate(token.deactivated_at)}</span>
                          ) : (
                            <span className="text-emerald-300">| aktywny</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
