'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import api, {apiEndpoints} from '@/lib/api'
import { formatRelativeTime, getRoleColor, getInitials } from '@/lib/utils'
import { Header } from '@/components/layout/Header'
import { UserRoleDialog } from '@/components/dialogs/UserRoleDialog'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Search, ArrowLeft, UserPlus, Users } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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

const secureAdminUsersFetcher = (url: string) => api.get(url).then(res => res.data.data);

const UserManagementSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-20" />
        <div>
          <Skeleton className="h-8 w-60 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
      </div>
    </div>
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 sm:w-48" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <TableHeader>
        <TableRow>
          <TableHead><Skeleton className="h-5 w-48" /></TableHead>
          <TableHead><Skeleton className="h-5 w-24" /></TableHead>
          <TableHead><Skeleton className="h-5 w-32" /></TableHead>
          <TableHead><Skeleton className="h-5 w-32" /></TableHead>
          <TableHead><Skeleton className="h-5 w-24" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, i) => (
          <TableRow key={i}>
            <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-5 w-40" /></div></TableCell>
            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
            <TableCell><Skeleton className="h-9 w-24 rounded-md" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Card>
  </div>
);

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1); // Reset page on new search
    }, 500)
    return () => clearTimeout(timerId)
  }, [searchTerm])

  const { data: usersData, error, mutate, isLoading } = useSWR<UsersApiResponse>(
    `/api/admin/users?page=${currentPage}&limit=10&search=${debouncedSearchTerm}&role=${roleFilter}`,
    secureAdminUsersFetcher
  )

  const users: User[] = usersData?.users || []
  const pagination = usersData?.pagination

  const handleRoleUpdate = async (userId: number, newRole: 'USER' | 'MANAGER' | 'ADMIN') => {
    try {
      await apiEndpoints.updateUserRoleInIdP(userId, newRole);
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto py-8">
            <UserManagementSkeleton />
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto py-6 text-center">
            <p className="text-destructive">Error loading users. Please try again.</p>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-8">
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
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
                    View, manage, and assign roles to all users in the system.
                  </p>
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full sm:w-48 h-10 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">All Roles</option>
                    <option value="USER">User</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User List</CardTitle>
                <CardDescription>
                  {pagination ? `${pagination.total} total users found` : 'Manage user accounts and roles'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <motion.tr key={user.id} variants={itemVariants} className="hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.email}</div>
                                {!user.emailVerified && <div className="text-xs text-amber-600">Unverified</div>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div>{user._count.projectsOwned} Projects</div>
                            <div>{user._count.tasksAssigned} Tasks</div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatRelativeTime(user.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRoleDialog(user)}
                            >
                              Manage Role
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </motion.tbody>
                </Table>

                {pagination && pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.pages}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))} disabled={currentPage === pagination.pages}>Next</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

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