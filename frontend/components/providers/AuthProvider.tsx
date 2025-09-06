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
    
    // Always set loading to false for public paths
    if (publicPaths.some(path => currentPath.startsWith(path))) {
      setLoading(false)
      return
    }
    
    const token = localStorage.getItem('access_token')
    
    // If there's no token and we're not on a public path, redirect to home
    if (!token) {
      window.location.href = '/'
      return
    }
    
    // If we have a token, validate it
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))

      if (payload.exp * 1000 > Date.now()) {
        // Token is valid, set the user in the global state
        const currentUser = {
          id: payload.userId,     
          email: payload.sub,       
          role: payload.role,
          emailVerified: true   
        }
        setUser(currentUser)
      } else {
        // Token is expired, clear the state and the token
        console.log("Session expired, logging out.")
        useAuthStore.getState().logout()
      }
    } catch (error) {
      // If token is malformed, log out
      console.error('Failed to initialize auth from stored token:', error)
      useAuthStore.getState().logout()
    }
    
    setLoading(false)
  }, [setLoading, setUser])

  return <>{children}</>
}