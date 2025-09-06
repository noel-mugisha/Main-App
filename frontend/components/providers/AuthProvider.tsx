'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { useRouter, useSearchParams } from 'next/navigation'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for access token in URL params (from IdP redirect)
        const accessToken = searchParams.get('access_token')
        
        if (accessToken) {
          // Store token and decode user info
          localStorage.setItem('access_token', accessToken)
          
          // Decode JWT to get user info (basic implementation)
          try {
            const payload = JSON.parse(atob(accessToken.split('.')[1]))
            const user = {
              id: payload.sub || payload.userId,
              email: payload.email,
              role: payload.role || 'USER',
              emailVerified: payload.email_verified || false
            }
            
            setUser(user)
            
            // Clean up URL
            const url = new URL(window.location.href)
            url.searchParams.delete('access_token')
            window.history.replaceState({}, '', url.toString())
          } catch (error) {
            console.error('Error decoding token:', error)
            localStorage.removeItem('access_token')
          }
        } else {
          // Check for existing token
          const existingToken = localStorage.getItem('access_token')
          if (existingToken) {
            try {
              // Verify token with backend
              const response = await fetch('/api/backend/health')
              if (response.ok) {
                // Token is valid, decode user info
                const payload = JSON.parse(atob(existingToken.split('.')[1]))
                const user = {
                  id: payload.sub || payload.userId,
                  email: payload.email,
                  role: payload.role || 'USER',
                  emailVerified: payload.email_verified || false
                }
                setUser(user)
              } else {
                localStorage.removeItem('access_token')
              }
            } catch (error) {
              console.error('Error verifying token:', error)
              localStorage.removeItem('access_token')
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [searchParams, setUser, setLoading])

  // Removed automatic redirect - users will see landing page first
  // and can choose to sign in via the sign-in button

  return <>{children}</>
}

