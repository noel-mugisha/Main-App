'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const publicPaths = ['/', '/auth/callback']
    const currentPath = window.location.pathname
    if (publicPaths.some(path => currentPath.startsWith(path))) {
      setLoading(false)
      return
    }

    const token = localStorage.getItem('access_token')
    if (!token) {
        setLoading(false)
        return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))

      if (payload.exp * 1000 > Date.now()) {
        const currentUser = {
          id: payload.userId,
          email: payload.sub,
          role: payload.role,
        }
        setUser(currentUser)
      }
    } catch (error) {
      console.error('Failed to parse stored token:', error)
      useAuthStore.getState().logout()
    }

    setLoading(false)
  }, [setLoading, setUser])

  return <>{children}</>
}