import type { Metadata } from "next"

import { ErrorInfoContent } from "./error-content"

export const metadata: Metadata = {
  title: "Status systemu | Dziennik Rutyn Eryka",
  description: "Zobacz aktualny status usług oraz wskazówki dotyczące pracy w trybie offline.",
}

export default function ErrorInfoPage() {
  return (
    <ErrorInfoContent />
  )
}
