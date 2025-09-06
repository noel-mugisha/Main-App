'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const initializeAuth = () => {
      if (window.location.pathname.includes('/auth/callback')) {
        setLoading(false)
        return
      }
      
      const token = localStorage.getItem('access_token')
      
      if (token) {
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
      }
      
      setLoading(false)
    }

    initializeAuth()
  }, [setLoading, setUser]) 

  return <>{children}</>
}