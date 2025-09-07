'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import api, { apiEndpoints } from '@/lib/api'
import { formatRelativeTime, getStatusColor } from '@/lib/utils'
import { CheckCircle, Clock, Circle, Plus } from 'lucide-react'
import { TaskStatusDialog } from '@/components/dialogs/TaskStatusDialog'

interface Task {
  id: number
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  project: {
    id: number
    name: string
    manager: {
      id: number
      email: string
    }
  }
  createdAt: string
  updatedAt: string
}

const secureFetcher = (url: string) => api.get(url).then(res => res.data.data);

export function UserDashboard() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)

  const { data: tasksData, error, mutate } = useSWR<Task[]>('/api/tasks', secureFetcher)

  const tasks: Task[] = tasksData || []
  const isLoading = !tasksData && !error

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

  const todoTasks = tasks.filter(task => task.status === 'TODO')
  const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS')
  const doneTasks = tasks.filter(task => task.status === 'DONE')

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
        <p className="text-destructive">Error loading tasks. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground">
          Manage your assigned tasks and track progress
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TODO Column */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Circle className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold">To Do</h2>
            <Badge variant="secondary">{todoTasks.length}</Badge>
          </div>
          <div className="space-y-3">
            {todoTasks.map((task) => (
              <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{task.title}</CardTitle>
                  <CardDescription>
                    Project: {task.project.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(task.createdAt)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openStatusDialog(task)}
                    >
                      Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {todoTasks.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Circle className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No tasks to do</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* IN PROGRESS Column */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">In Progress</h2>
            <Badge variant="secondary">{inProgressTasks.length}</Badge>
          </div>
          <div className="space-y-3">
            {inProgressTasks.map((task) => (
              <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{task.title}</CardTitle>
                  <CardDescription>
                    Project: {task.project.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
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
                </CardContent>
              </Card>
            ))}
            {inProgressTasks.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No tasks in progress</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* DONE Column */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold">Done</h2>
            <Badge variant="secondary">{doneTasks.length}</Badge>
          </div>
          <div className="space-y-3">
            {doneTasks.map((task) => (
              <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{task.title}</CardTitle>
                  <CardDescription>
                    Project: {task.project.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(task.updatedAt)}
                    </span>
                    <Badge className={getStatusColor(task.status)}>
                      {getStatusIcon(task.status)}
                      <span className="ml-1">{task.status}</span>
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {doneTasks.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <CheckCircle className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No completed tasks</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <TaskStatusDialog
        task={selectedTask}
        isOpen={isStatusDialogOpen}
        onClose={() => {
          setIsStatusDialogOpen(false)
          setSelectedTask(null)
        }}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  )
}
