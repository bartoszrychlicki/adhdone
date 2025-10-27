"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

type NetworkState = "online" | "offline" | "unknown"

export function OfflineBanner() {
  const [status, setStatus] = useState<NetworkState>("unknown")

  useEffect(() => {
    function evaluateStatus() {
      if (typeof navigator !== "undefined") {
        setStatus(navigator.onLine ? "online" : "offline")
      }
    }

    function handleOnline() {
      setStatus("online")
    }

    function handleOffline() {
      setStatus("offline")
    }

    evaluateStatus()
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (status !== "offline") {
    return null
  }

  return (
    <div className="rounded-3xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-50 shadow-inner shadow-amber-900/40">
      <div className="flex items-center gap-2">
        <WifiOff className="size-4 shrink-0" aria-hidden />
        <p className="font-medium">
          Brak połączenia. Możesz kontynuować czynności offline – zsynchronizujemy postęp po odzyskaniu sieci.
        </p>
      </div>
    </div>
  )
}

