"use server"

type LoginState =
  | { status: "idle" }
  | { status: "error"; message: string }

function sanitizePin(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null
  }

  const pin = value.trim()
  if (pin.length === 0) {
    return ""
  }

  return /^[0-9]{4,6}$/.test(pin) ? pin : null
}

function sanitizeToken(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null
  }

  const token = value.trim()
  if (token.length === 0) {
    return ""
  }

  return token.length >= 8 ? token : null
}

export async function loginChild(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const pin = sanitizePin(formData.get("pin"))
  const token = sanitizeToken(formData.get("token"))

  if (pin === null) {
    return {
      status: "error",
      message: "PIN powinien składać się z 4–6 cyfr.",
    }
  }

  if (token === null) {
    return {
      status: "error",
      message: "Token powinien zawierać co najmniej 8 znaków.",
    }
  }

  // The backend flow for exchanging child PIN/token to a Supabase session
  // is tracked separately. For now we keep the UI responsive and provide
  // guidance to the user until the API is ready.
  return {
    status: "error",
    message:
      "Logowanie dziecka zostanie aktywowane po wygenerowaniu tokenu przez rodzica. Poproś rodzica o udostępnienie aktualnego linku lub PIN-u.",
  }
}
