import { z } from "zod"

export const loginSchema = z.object({
    email: z.string().email({ message: "Nieprawidłowy adres email" }),
    password: z.string().min(1, { message: "Hasło jest wymagane" }),
})

export const registerSchema = z
    .object({
        email: z.string().email({ message: "Nieprawidłowy adres email" }),
        password: z.string().min(6, { message: "Hasło musi mieć co najmniej 6 znaków" }),
        confirmPassword: z.string().min(6, { message: "Powtórz hasło" }),
        acceptTerms: z.literal(true, {
            message: "Musisz zaakceptować regulamin",
        }),
    })
    .refine((data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword, {
        message: "Hasła muszą być identyczne",
        path: ["confirmPassword"],
    })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
