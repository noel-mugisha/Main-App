'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import api, { apiEndpoints } from '@/lib/api'
import { formatRelativeTime } from '@/lib/utils'
import { Plus, FolderGit2, ListChecks, Clock, Eye, FolderOpen } from 'lucide-react'
import { CreateProjectDialog } from '@/components/dialogs/CreateProjectDialog'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { Skeleton } from '../ui/skeleton'

interface Project {
  id: number
  name: string
  description?: string
  tasks: Task[]
  createdAt: string
}

interface Task {
  id: number
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
}

const secureFetcher = (url: string) => api.get(url).then(res => res.data.data);

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

const ManagerDashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-9 w-56 mb-2" />
        <Skeleton className="h-5 w-72" />
      </div>
      <Skeleton className="h-10 w-36" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-6 rounded-lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12 mb-2" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="space-y-4 p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-24" />
          </div>
        </Card>
      ))}
    </div>
  </div>
);


export function ManagerDashboard() {
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const { data: projectsData, error, mutate, isLoading } = useSWR<Project[]>('/api/projects', secureFetcher)

  const projects: Project[] = projectsData || []

  const handleProjectCreate = async (projectData: { name: string; description?: string }) => {
    try {
      await apiEndpoints.createProject(projectData)
      mutate() // Refresh data
      setIsCreateProjectOpen(false)
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const getProjectStats = (project: Project) => {
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter(task => task.status === 'DONE').length
    return {
      total: totalTasks,
      completed: completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    }
  }

  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0);
  const totalInProgress = projects.reduce((sum, p) => sum + p.tasks.filter(t => t.status === 'IN_PROGRESS').length, 0);

  if (isLoading) {
    return <ManagerDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading projects. Please try again.</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Oversee your projects, track team progress, and create new initiatives.
          </p>
        </div>
        <Button onClick={() => setIsCreateProjectOpen(true)} className="shadow-sm hover:shadow-lg transition-shadow">
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </motion.div>

      {/* Stats Overview */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" variants={containerVariants}>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderGit2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">projects under your management</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-xs text-muted-foreground">across all your projects</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInProgress}</div>
              <p className="text-xs text-muted-foreground">currently being worked on</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Projects Grid */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold tracking-tight mb-4">My Projects</h2>
        {projects.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
          >
            {projects.map((project) => {
              const stats = getProjectStats(project)
              return (
                <motion.div
                  key={project.id}
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card className="flex flex-col h-full hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                      </div>
                      {project.description && (
                        <CardDescription className="line-clamp-2 h-10">
                          {project.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="flex flex-col flex-grow justify-end space-y-4">
                      <div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span className="font-semibold text-foreground">{stats.completionRate}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                           <motion.div
                            className="bg-primary h-2.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.completionRate}%` }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{stats.completed} of {stats.total} tasks complete</p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-muted-foreground">
                          Created {formatRelativeTime(project.createdAt)}
                        </span>
                        <Button asChild size="sm">
                          <Link href={`/projects/${project.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Project
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <Card className="border-dashed border-2 hover:border-primary transition-colors">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                It looks like you haven't created any projects. Get started by creating your first one now.
              </p>
              <Button onClick={() => setIsCreateProjectOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      <CreateProjectDialog
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onSubmit={handleProjectCreate}
      />
    </motion.div>
  )
}