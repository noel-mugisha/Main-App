'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { apiEndpoints } from '@/lib/api'
import { formatRelativeTime } from '@/lib/utils'
import { Plus, Users, CheckCircle, Clock, Circle, Eye } from 'lucide-react'
import { CreateProjectDialog } from '@/components/dialogs/CreateProjectDialog'
import Link from 'next/link'

interface Project {
  id: number
  name: string
  description?: string
  manager: {
    id: number
    email: string
    role: string
  }
  tasks: Task[]
  createdAt: string
  updatedAt: string
}

interface Task {
  id: number
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  assignee?: {
    id: number
    email: string
  }
  createdAt: string
  updatedAt: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function ManagerDashboard() {
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)

  const { data: projectsData, error, mutate } = useSWR('/api/backend/projects', fetcher)

  const projects: Project[] = projectsData?.data || []
  const isLoading = !projectsData && !error

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
    const inProgressTasks = project.tasks.filter(task => task.status === 'IN_PROGRESS').length
    const todoTasks = project.tasks.filter(task => task.status === 'TODO').length

    return {
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      todo: todoTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading projects. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects and track team progress
          </p>
        </div>
        <Button onClick={() => setIsCreateProjectOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.reduce((sum, project) => sum + project.tasks.length, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.reduce((sum, project) => 
                sum + project.tasks.filter(task => task.status === 'IN_PROGRESS').length, 0
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.reduce((sum, project) => 
                sum + project.tasks.filter(task => task.status === 'DONE').length, 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const stats = getProjectStats(project)
          return (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="outline">
                    {stats.completionRate}% complete
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Task Status Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Circle className="h-3 w-3 mr-1 text-gray-500" />
                      To Do
                    </span>
                    <span className="font-medium">{stats.todo}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-blue-500" />
                      In Progress
                    </span>
                    <span className="font-medium">{stats.inProgress}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                      Done
                    </span>
                    <span className="font-medium">{stats.completed}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{stats.completed}/{stats.total}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.completionRate}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    Created {formatRelativeTime(project.createdAt)}
                  </span>
                  <div className="flex space-x-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/projects/${project.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {projects.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first project to start managing tasks and collaborating with your team.
            </p>
            <Button onClick={() => setIsCreateProjectOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateProjectDialog
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onSubmit={handleProjectCreate}
      />
    </div>
  )
}
