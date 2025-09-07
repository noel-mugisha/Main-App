'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

export default function AuthCallbackClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useAuthStore()

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const handleLogin = async () => {
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')

      if (accessToken && refreshToken) {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken)

        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]))
          const user = {
            id: payload.userId || payload.sub,
            email: payload.sub,
            role: payload.role,
          }

          setUser(user)
          setStatus('success')

          // wait 1.5s before redirect
          setTimeout(() => router.push('/dashboard'), 1500)
        } catch (error) {
          console.error('Failed to decode JWT or set user:', error)
          setStatus('error')
          router.push('/?error=invalid_token')
        }
      } else {
        console.error('No access token found in callback URL')
        setStatus('error')
        router.push('/?error=auth_failed')
      }
    }

    handleLogin()
  }, [router, searchParams, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Card className="w-[380px] shadow-2xl border-0 rounded-2xl bg-white/90 backdrop-blur">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-800">
              {status === 'success' ? 'Signed In!' : 'Completing Sign In'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {status === 'success'
                ? 'Redirecting you to your dashboard...'
                : 'Please wait while we process your authentication...'}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center gap-4 py-6">
            <AnimatePresence mode="wait">
              {status === 'loading' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <LoadingSpinner size="lg" />
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
