'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    // If not loading and not authenticated, redirect to IdP
    if (!isLoading && !isAuthenticated) {
      const idpUrl = process.env.NEXT_PUBLIC_IDP_URL || 'http://localhost:8080'
      window.location.href = idpUrl
    }
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
