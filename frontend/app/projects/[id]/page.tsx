'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import api, { apiEndpoints } from '@/lib/api'
import { formatRelativeTime, getStatusColor } from '@/lib/utils'
import { ArrowLeft, Plus, Users, CheckCircle, Clock, Circle, MoreVertical } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { CreateTaskDialog } from '@/components/dialogs/CreateTaskDialog'
import { TaskStatusDialog } from '@/components/dialogs/TaskStatusDialog'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
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

const secureFetcher = (url: string) => api.get(url).then(res => res.data.data);

export default function ProjectPage({ params }: { params: { id: string } }) {
  const projectId = parseInt(params.id)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)

  const { data: projectData, error, mutate } = useSWR(`/api/projects/${projectId}`, secureFetcher)

  const project: Project | undefined = projectData
  const isLoading = !projectData && !error

  const handleTaskCreate = async (taskData: { title: string; assigneeId?: number }) => {
    try {
      await apiEndpoints.createTask(projectId, taskData)
      mutate() // Refresh data
      setIsCreateTaskOpen(false)
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleStatusUpdate = async (taskId: number, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    try {
      await apiEndpoints.updateTaskStatus(taskId, newStatus)
      mutate() // Refresh data
      setIsStatusDialogOpen(false)
      setSelectedTask(null)
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const openStatusDialog = (task: Task) => {
    setSelectedTask(task)
    setIsStatusDialogOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO':
        return <Circle className="h-4 w-4" />
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4" />
      case 'DONE':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Circle className="h-4 w-4" />
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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-6">
          <div className="text-center py-12">
            <p className="text-destructive">Project not found or you don't have access to it.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const stats = getProjectStats(project)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-6">
          <div className="space-y-6">
            {/* Project Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Link>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                  {project.description && (
                    <p className="text-muted-foreground mt-1">{project.description}</p>
                  )}
                </div>
              </div>
              <Button onClick={() => setIsCreateTaskOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>

            {/* Project Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                  <Circle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">To Do</CardTitle>
                  <Circle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todo}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.inProgress}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completed}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.completionRate}% complete
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Progress Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Project Progress</span>
                    <span>{stats.completed}/{stats.total} tasks</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.completionRate}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasks List */}
            <Card>
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>
                  Manage and track all project tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.tasks.length === 0 ? (
                    <div className="text-center py-8">
                      <Circle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first task to get started with this project.
                      </p>
                      <Button onClick={() => setIsCreateTaskOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Task
                      </Button>
                    </div>
                  ) : (
                    project.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(task.status)}
                            <span className="font-medium">{task.title}</span>
                          </div>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                          {task.assignee && (
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>{task.assignee.email}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(task.updatedAt)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openStatusDialog(task)}
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <CreateTaskDialog
            isOpen={isCreateTaskOpen}
            onClose={() => setIsCreateTaskOpen(false)}
            onSubmit={handleTaskCreate}
          />

          <TaskStatusDialog
            task={selectedTask}
            isOpen={isStatusDialogOpen}
            onClose={() => {
              setIsStatusDialogOpen(false)
              setSelectedTask(null)
            }}
            onStatusUpdate={handleStatusUpdate}
          />
        </main>
      </div>
    </ProtectedRoute>
  )
}