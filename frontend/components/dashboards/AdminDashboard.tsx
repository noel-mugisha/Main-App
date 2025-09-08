'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import api, { apiEndpoints } from '@/lib/api'
import { formatRelativeTime, getInitials, getRoleColor } from '@/lib/utils'
import { Users, FolderGit2, ListChecks, UserCheck, ArrowRight } from 'lucide-react'
import { UserRoleDialog } from '@/components/dialogs/UserRoleDialog'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Skeleton } from '../ui/skeleton'

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

// This interface describes the full shape of the /api/admin/users response
interface UsersApiResponse {
  users: User[]
  pagination: any
}

// Define secure fetchers that use our authenticated client
const secureStatsFetcher = (url: string) => api.get(url).then(res => res.data.data);
const secureUsersFetcher = (url: string) => api.get(url).then(res => res.data.data);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants : Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100
    }
  }
};

// Skeleton Loader Component
const AdminDashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card>
      <CardHeader>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

export function AdminDashboard() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)

  // Use the secure fetchers with SWR, correctly typed
  const { data: usersResponse, error: usersError, mutate: mutateUsers } = useSWR<UsersApiResponse>('/api/admin/users?limit=5', secureUsersFetcher)
  const { data: statsData, error: statsError } = useSWR<AdminStats>('/api/admin/stats', secureStatsFetcher)

  const users: User[] = usersResponse?.users || []
  const stats: AdminStats = statsData || {
    overview: { totalUsers: 0, totalProjects: 0, totalTasks: 0 },
    usersByRole: {},
    tasksByStatus: {},
    recentActivity: []
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
  
  const StatCard = ({ title, value, description, icon, gradient }: { title: string, value: string | number, description?: string, icon: React.ReactNode, gradient: string }) => (
    <motion.div variants={itemVariants}>
      <Card className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
        <div className={`p-6 flex flex-col justify-between h-full ${gradient} text-white`}>
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-medium text-white/90">{title}</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              {icon}
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold">{value}</div>
            {description && <p className="text-xs text-white/80">{description}</p>}
          </div>
        </div>
      </Card>
    </motion.div>
  );


  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  if (usersError || statsError) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading admin data. Please try again.</p>
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Oversee system-wide activity, manage users, and monitor all projects.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin">
            Full User Management
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </motion.div>

      {/* Stats Overview */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
      >
        <StatCard title="Total Users" value={stats.overview.totalUsers} description={`${stats.usersByRole.ADMIN || 0} Admins, ${stats.usersByRole.MANAGER || 0} Managers`} icon={<Users className="h-5 w-5 text-white" />} gradient="bg-gradient-to-br from-indigo-500 to-blue-500" />
        <StatCard title="Total Projects" value={stats.overview.totalProjects} description="Across all managers" icon={<FolderGit2 className="h-5 w-5 text-white" />} gradient="bg-gradient-to-br from-purple-500 to-pink-500" />
        <StatCard title="Total Tasks" value={stats.overview.totalTasks} description={`${stats.tasksByStatus.DONE || 0} completed`} icon={<ListChecks className="h-5 w-5 text-white" />} gradient="bg-gradient-to-br from-emerald-500 to-green-500" />
        <StatCard title="Verified Users" value={users.filter(user => user.emailVerified).length} description={`of ${stats.overview.totalUsers} total users`} icon={<UserCheck className="h-5 w-5 text-white" />} gradient="bg-gradient-to-br from-amber-500 to-orange-500" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recently Active Users</CardTitle>
              <CardDescription>
                Users who have recently joined or been active.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.map((user) => (
                  <motion.div
                    key={user.id}
                    className="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{user.email}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">Joined {formatRelativeTime(user.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getRoleColor(user.role)} variant="secondary">
                        {user.role}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openRoleDialog(user)}
                      >
                        Manage
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Activity */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest task updates across the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-1 h-full bg-border rounded-full mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-tight">
                        Task "{activity.title}" in <span className="font-semibold text-primary">{activity.project?.name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status changed to {activity.status} • {formatRelativeTime(activity.updatedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
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
    </motion.div>
  )
}