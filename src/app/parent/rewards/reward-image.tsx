"use client"

import { useCallback, useMemo, useState } from "react"

const FALLBACK_SRC = "/images/rewards/placeholder.svg"

type RewardImageProps = {
  src?: string | null
  alt: string
}

export function RewardImage({ src, alt }: RewardImageProps) {
  const initialSrc = useMemo(() => {
    if (typeof src === "string" && src.trim().length > 0) {
      return src
    }

    return FALLBACK_SRC
  }, [src])

  const [currentSrc, setCurrentSrc] = useState(initialSrc)

  const handleError = useCallback(() => {
    if (currentSrc !== FALLBACK_SRC) {
      setCurrentSrc(FALLBACK_SRC)
    }
  }, [currentSrc])

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={currentSrc} alt={alt} className="size-full object-cover" onError={handleError} />
  )
}

