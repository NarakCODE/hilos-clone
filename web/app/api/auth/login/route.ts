import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SESSION_COOKIE, SESSION_VALUE, COOKIE_OPTIONS } from "@/lib/auth"

export async function GET() {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, SESSION_VALUE, COOKIE_OPTIONS)
  redirect("/tickets")
}
