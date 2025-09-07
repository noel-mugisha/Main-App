'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import api, { apiEndpoints } from '@/lib/api'
import { formatRelativeTime, getRoleColor } from '@/lib/utils'
import { Users, UserCheck, Settings, BarChart3 } from 'lucide-react'
import { UserRoleDialog } from '@/components/dialogs/UserRoleDialog'
import Link from 'next/link'

// Define interfaces for our data to ensure type safety
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

interface AdminStats {
  overview: {
    totalUsers: number
    totalProjects: number
    totalTasks: number
  }
  usersByRole: Record<string, number>
  tasksByStatus: Record<string, number>
  recentActivity: any[] 
}

interface UsersApiResponse {
  users: User[]
  pagination: any
}

// Define secure fetchers that use our authenticated client
const secureStatsFetcher = (url: string) => api.get(url).then(res => res.data.data);
const secureUsersFetcher = (url: string) => api.get(url).then(res => res.data.data);

export function AdminDashboard() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)

  const { data: usersResponse, error: usersError, mutate: mutateUsers } = useSWR<UsersApiResponse>('/api/admin/users', secureUsersFetcher)
  const { data: statsData, error: statsError } = useSWR<AdminStats>('/api/admin/stats', secureStatsFetcher)

  const users: User[] = usersResponse?.users || []
  const stats: AdminStats = statsData || {
    overview: { totalUsers: 0, totalProjects: 0, totalTasks: 0 },
    usersByRole: {},
    tasksByStatus: {},
    recentActivity: [] // Ensure recentActivity is always an array
  }

  const isLoading = (!usersResponse && !usersError) || (!statsData && !statsError)

  const handleRoleUpdate = async (userId: number, newRole: 'USER' | 'MANAGER' | 'ADMIN') => {
    try {
      await apiEndpoints.updateUserRole(userId, newRole)
      mutateUsers()
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (usersError || statsError) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading admin data. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, monitor system activity, and oversee all projects
          </p>
        </div>
        <div className="flex space-x-2">
          <Button asChild variant="outline">
            <Link href="/admin">
              <Settings className="h-4 w-4 mr-2" />
              Admin Panel
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.usersByRole.ADMIN || 0} admins, {stats.usersByRole.MANAGER || 0} managers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.tasksByStatus.DONE || 0} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(user => user.emailVerified).length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {users.length} total users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>
            Latest user registrations and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
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
            ))}
          </div>
          {users.length > 5 && (
            <div className="mt-4 text-center">
              <Button asChild variant="outline">
                <Link href="/admin">
                  View All Users
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Activity */}
      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest task updates across the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Task "{activity.title}" updated to {activity.status}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      In Project: {activity.project?.name} • By: {activity.assignee?.email || 'System'} • {formatRelativeTime(activity.updatedAt)}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <UserRoleDialog
        user={selectedUser}
        isOpen={isRoleDialogOpen}
        onClose={() => {
          setIsRoleDialogOpen(false)
          setSelectedUser(null)
        }}
        onRoleUpdate={handleRoleUpdate}
      />
    </div>
  )
}