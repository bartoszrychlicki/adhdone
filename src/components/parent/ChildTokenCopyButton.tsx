"use client"

import { useEffect, useState } from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"

type CopyState = "idle" | "success" | "error"

type ChildTokenCopyButtonProps = {
  loginLink: string
}

export function ChildTokenCopyButton({ loginLink }: ChildTokenCopyButtonProps) {
  const [status, setStatus] = useState<CopyState>("idle")
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        setStatus("idle")
        setMessage(null)
      }, 2000)

      return () => clearTimeout(timer)
    }

    return undefined
  }, [status])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(loginLink)
      setStatus("success")
      setMessage("Skopiowano link do schowka.")
    } catch (error) {
      console.warn("[ChildTokenCopyButton] Clipboard write failed", error)
      setStatus("error")
      setMessage("Nie udało się skopiować linku. Spróbuj ponownie.")
    }
  }

  const isSuccess = status === "success"

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        size="sm"
        variant={isSuccess ? "secondary" : "outline"}
        className="border-slate-700/60"
        onClick={handleCopy}
      >
        {isSuccess ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />} Skopiuj link
      </Button>
      <div className="space-y-1 text-xs">
        <div className="overflow-hidden text-ellipsis break-all rounded-md border border-slate-700/60 bg-slate-900/50 px-3 py-2 font-mono text-[11px] text-slate-100">
          {loginLink}
        </div>
        <p className="leading-snug text-slate-400">Udostępnij ten link dziecku. Przy logowaniu poprosimy o aktualny PIN.</p>
        <span className="text-slate-400" aria-live="polite">
          {message ?? ""}
        </span>
      </div>
    </div>
  )
}
