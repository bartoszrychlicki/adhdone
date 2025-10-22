import { Shield } from "lucide-react"

import { Badge } from "@/components/ui/badge"

export function SecurityCallout() {
  return (
    <section
      aria-labelledby="security-callout-title"
      className="mt-10 flex flex-col gap-4 rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 text-slate-100 backdrop-blur"
    >
      <Badge
        variant="outline"
        className="w-fit border-slate-700/60 bg-slate-900/50 text-xs uppercase tracking-wide text-slate-200"
      >
        Bezpieczeństwo przede wszystkim
      </Badge>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 rounded-full bg-slate-800/80 p-2">
            <Shield className="size-5 text-emerald-300" aria-hidden />
          </span>
          <div>
            <h2 id="security-callout-title" className="text-lg font-semibold">
              Kontrolujesz dostęp dla każdego użytkownika
            </h2>
            <p className="mt-1 text-sm text-slate-200/80">
              Sesja dziecka wygasa po dwóch godzinach, a wejście do panelu rodzica zawsze wymaga ponownego
              logowania. Możesz dezaktywować token dziecka jednym kliknięciem.
            </p>
          </div>
        </div>
        <ul className="grid gap-2 text-sm text-slate-200/90 md:min-w-[16rem]">
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-emerald-400">
              •
            </span>
            Ochrona PIN z blokadą po 5 próbach
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-emerald-400">
              •
            </span>
            Rodzic zawsze zatwierdza nagrody
          </li>
        </ul>
      </div>
    </section>
  )
}
