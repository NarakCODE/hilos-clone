export const SESSION_COOKIE = "session"
export const SESSION_VALUE = "authenticated"

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
}

export type AuthUser = {
  name: string
  email: string
  avatar: string
}
