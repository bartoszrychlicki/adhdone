"use client"

import { useState } from "react"
import { Confetti, Volume2, VolumeX } from "lucide-react"

export function CelebrationBanner() {
  const [muted, setMuted] = useState(false)

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-500/50 bg-gradient-to-br from-amber-400/40 via-orange-500/30 to-pink-500/30 p-6 text-amber-50 shadow-lg shadow-amber-900/40">
      <div
        className="absolute inset-0 -z-10 animate-pulse bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_60%)]"
        aria-hidden
        style={{ opacity: muted ? 0.2 : 0.7 }}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-amber-100/90">
            <Confetti className="size-5" aria-hidden />
            Rutyna zakończona!
          </div>
          <h1 className="text-3xl font-semibold text-white">Świetna robota!</h1>
          <p className="text-sm text-amber-50/80">
            Zgarnąłeś wszystkie dostępne punkty. Sprawdź nagrody i pochwal się rodzicowi.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-50 transition hover:border-amber-300/70 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-200"
          onClick={() => setMuted((prev) => !prev)}
        >
          {muted ? (
            <>
              <VolumeX className="size-4" aria-hidden />
              Włącz animację
            </>
          ) : (
            <>
              <Volume2 className="size-4" aria-hidden />
              Wycisz efekty
            </>
          )}
        </button>
      </div>
    </div>
  )
}

