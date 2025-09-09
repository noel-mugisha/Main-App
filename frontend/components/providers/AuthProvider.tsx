'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    // We still want to stop loading on public pages without checking for a token.
    const publicPaths = ['/', '/auth/callback']
    const currentPath = window.location.pathname
    if (publicPaths.some(path => currentPath.startsWith(path))) {
      setLoading(false)
      return
    }

    const token = localStorage.getItem('access_token')
    
    // If there is no token, we can safely set loading to false and let the
    // ProtectedRoute handle the redirect.
    if (!token) {
        setLoading(false)
        return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))

      // If the token is NOT expired, set the user.
      // If it IS expired, do nothing. We will let the first API call fail with a
      // 401, which will trigger our refresh interceptor in `api.ts`.
      if (payload.exp * 1000 > Date.now()) {
        const currentUser = {
          id: payload.userId,
          email: payload.sub,
          role: payload.role,
        }
        setUser(currentUser)
      }
    } catch (error) {
      // Malformed token, treat as logged out.
      console.error('Failed to parse stored token:', error)
      useAuthStore.getState().logout()
    }

    // We can now safely say the initial loading is complete.
    setLoading(false)
  }, [setLoading, setUser])

  return <>{children}</>
}