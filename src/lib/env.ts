export function getAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL

  if (!raw) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is not defined. Please set it in your environment variables."
    )
  }

  return raw.replace(/\/$/, "")
}
