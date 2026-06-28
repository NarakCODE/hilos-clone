"use client"

import * as React from "react"

import { currentUser as demoUser } from "@/lib/current-user"
import type { AuthUser } from "@/lib/auth"

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const hasSession = document.cookie
      .split("; ")
      .some((cookie) => cookie.startsWith("session="))

    if (hasSession) {
      setUser(demoUser)
    }
    setIsLoading(false)
  }, [])

  const logout = React.useCallback(() => {
    window.location.href = "/api/auth/logout"
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
