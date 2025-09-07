'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
// =========================================================================
// CHANGE #1: Import the secure `api` client
// =========================================================================
import api from '@/lib/api'
import { apiEndpoints } from '@/lib/api'
import { formatRelativeTime, getRoleColor } from '@/lib/utils'
import { Header } from '@/components/layout/Header'
import { UserRoleDialog } from '@/components/dialogs/UserRoleDialog'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Search, Settings, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: number
  email: string
  role: 'USER' | 'MANAGER' | 'ADMIN'
  emailVerified: boolean
  createdAt: string
  _count: {
    projectsOwned: number
    tasksAssigned: number
  }
}

interface UsersApiResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// =========================================================================
// CHANGE #2: Define the secure fetcher using our authenticated `api` client
// =========================================================================
const secureAdminUsersFetcher = (url: string) => api.get(url).then(res => res.data.data);

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // =========================================================================
  // CHANGE #3: Update useSWR to use the secure fetcher and the correct API path
  // =========================================================================
  const { data: usersData, error, mutate } = useSWR<UsersApiResponse>(
    `/api/admin/users?page=${currentPage}&limit=10&search=${searchTerm}&role=${roleFilter}`,
    secureAdminUsersFetcher
  )

  const users: User[] = usersData?.users || []
  const pagination = usersData?.pagination
  const isLoading = !usersData && !error

  const handleRoleUpdate = async (userId: number, newRole: 'USER' | 'MANAGER' | 'ADMIN') => {
    try {
      await apiEndpoints.updateUserRole(userId, newRole)
      mutate() // Refresh data
      setIsRoleDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error updating user role:', error)
    }
  }

  const openRoleDialog = (user: User) => {
    setSelectedUser(user)
    setIsRoleDialogOpen(true)
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value)
    setCurrentPage(1)
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto py-6">
            <div className="text-center py-12">
              <p className="text-destructive">Error loading users. Please try again.</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Link>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                  <p className="text-muted-foreground">
                    Manage user roles and permissions across the system
                  </p>
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users by email..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="sm:w-48">
                    <select
                      value={roleFilter}
                      onChange={(e) => handleRoleFilter(e.target.value)}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="">All Roles</option>
                      <option value="USER">Users</option>
                      <option value="MANAGER">Managers</option>
                      <option value="ADMIN">Admins</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  {pagination ? `${pagination.total} total users` : 'Manage user accounts and roles'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No users found for the current filters.</p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{user.email}</span>
                              <Badge className={getRoleColor(user.role)}>
                                {user.role}
                              </Badge>
                              {!user.emailVerified && (
                                <Badge variant="outline" className="text-orange-600 border-orange-200">
                                  Unverified
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>{user._count.projectsOwned} projects</span>
                              <span>{user._count.tasksAssigned} tasks</span>
                              <span>Joined {formatRelativeTime(user.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRoleDialog(user)}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {pagination && pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                      Showing page {pagination.page} of {pagination.pages}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                        disabled={currentPage === pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <UserRoleDialog
            user={selectedUser}
            isOpen={isRoleDialogOpen}
            onClose={() => {
              setIsRoleDialogOpen(false)
              setSelectedUser(null)
            }}
            onRoleUpdate={handleRoleUpdate}
          />
        </main>
      </div>
    </ProtectedRoute>
  )
}