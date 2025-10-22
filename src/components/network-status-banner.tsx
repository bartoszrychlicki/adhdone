"use client"

import { useEffect, useState } from "react"
import { Wifi, WifiOff } from "lucide-react"

type NetworkState = "online" | "offline" | "unknown"

/**
 * Displays the current network connectivity status.
 * The banner is hidden once we confirm the user is online.
 */
export function NetworkStatusBanner() {
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

  if (status === "online" || status === "unknown") {
    return null
  }

  return (
    <div className="w-full rounded-xl border border-amber-500/40 bg-amber-900/20 px-4 py-2 text-sm text-amber-100 shadow-sm shadow-amber-900/40">
      <div className="flex items-center gap-2">
        {status === "offline" ? (
          <WifiOff className="size-4 shrink-0" aria-hidden />
        ) : (
          <Wifi className="size-4 shrink-0" aria-hidden />
        )}
        <p className="font-medium">
          Wygląda na to, że jesteś offline. Zmiany zostaną zapisane po
          ponownym połączeniu.
        </p>
      </div>
    </div>
  )
}
