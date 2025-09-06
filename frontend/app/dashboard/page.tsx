'use client'

import { useAuthStore } from '@/lib/store'
import { UserDashboard } from '@/components/dashboards/UserDashboard'
import { ManagerDashboard } from '@/components/dashboards/ManagerDashboard'
import { AdminDashboard } from '@/components/dashboards/AdminDashboard'
import { Header } from '@/components/layout/Header'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function DashboardPage() {
  const { user } = useAuthStore()

  const renderDashboard = () => {
    switch (user?.role) {
      case 'ADMIN':
        return <AdminDashboard />
      case 'MANAGER':
        return <ManagerDashboard />
      case 'USER':
      default:
        return <UserDashboard />
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-6">
          {renderDashboard()}
        </main>
      </div>
    </ProtectedRoute>
  )
}

