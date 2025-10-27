export function getSupportedTimezones(): string[] {
  if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
    try {
      return Intl.supportedValuesOf("timeZone")
    } catch {
      // Ignore and fall back below
    }
  }

  return ["Europe/Warsaw", "UTC"]
}

