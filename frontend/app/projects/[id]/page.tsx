'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import api, { apiEndpoints } from '@/lib/api'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { ArrowLeft, Plus, Users, CheckCircle, Clock, CircleDot } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { CreateTaskDialog } from '@/components/dialogs/CreateTaskDialog'
import { TaskStatusDialog } from '@/components/dialogs/TaskStatusDialog'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

// Interfaces
interface Project {
  id: number; name: string; description?: string;
  tasks: Task[]; createdAt: string;
}
interface Task {
  id: number; title: string; status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignee?: { id: number; email: string };
  updatedAt: string;
}

const secureFetcher = (url: string) => api.get(url).then(res => res.data.data);

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Skeleton Loader Component
const ProjectPageSkeleton = () => (
  <main className="container mx-auto py-8 space-y-6">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-9 w-20" />
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>
    </div>
    <Card>
      <CardContent className="pt-6 space-y-2">
        <div className="flex justify-between text-sm"><Skeleton className="h-5 w-24" /><Skeleton className="h-5 w-16" /></div>
        <Skeleton className="h-2 w-full rounded-full" />
      </CardContent>
    </Card>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-7 w-32" />
          <Card className="p-4 space-y-2">
            <Skeleton className="h-5 w-48" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </Card>
          <Card className="p-4 space-y-2">
            <Skeleton className="h-5 w-40" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </Card>
        </div>
      ))}
    </div>
  </main>
);

export default function ProjectPage({ params }: { params: { id: string } }) {
  const projectId = parseInt(params.id)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const { data: project, error, mutate, isLoading } = useSWR<Project>(`/api/projects/${projectId}`, secureFetcher)

  const handleTaskCreate = async (taskData: { title: string; assigneeId?: number }) => {
    try {
      await apiEndpoints.createTask(projectId, taskData)
      mutate()
      setIsCreateTaskOpen(false)
    } catch (error) { console.error('Error creating task:', error) }
  }

  const handleStatusUpdate = async (taskId: number, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    try {
      await apiEndpoints.updateTaskStatus(taskId, newStatus)
      mutate()
      setSelectedTask(null)
    } catch (error) { console.error('Error updating task status:', error) }
  }

  const columns = {
    TODO: project?.tasks.filter(t => t.status === 'TODO') || [],
    IN_PROGRESS: project?.tasks.filter(t => t.status === 'IN_PROGRESS') || [],
    DONE: project?.tasks.filter(t => t.status === 'DONE') || [],
  };

  const totalTasks = project?.tasks.length || 0;
  const completedTasks = columns.DONE.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background"><Header /><ProjectPageSkeleton /></div>
      </ProtectedRoute>
    );
  }

  if (error || !project) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background"><Header />
          <div className="container mx-auto py-12 text-center">
            <p className="text-destructive">Project not found or you don't have access.</p>
            <Button asChild className="mt-4"><Link href="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Link></Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-8">
          <motion.div className="space-y-6" initial="hidden" animate="visible" variants={containerVariants}>
            {/* Project Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Button asChild variant="outline" size="icon"><Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link></Button>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                  {project.description && <p className="text-muted-foreground mt-1 max-w-2xl">{project.description}</p>}
                </div>
              </div>
              <Button onClick={() => setIsCreateTaskOpen(true)} className="shadow-sm"><Plus className="h-4 w-4 mr-2" />Add Task</Button>
            </motion.div>

            {/* Progress Bar */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground">Project Progress</span>
                      <span>{completedTasks} / {totalTasks} Tasks</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 relative overflow-hidden">
                      <motion.div
                        className="bg-primary h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${completionRate}%` }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Kanban Board */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* TODO Column */}
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center space-x-2 px-1">
                  <CircleDot className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">To Do</h2>
                  <Badge variant="secondary">{columns.TODO.length}</Badge>
                </div>
                <div className="space-y-3 h-full">
                  {columns.TODO.map(task => <TaskCard key={task.id} task={task} onStatusClick={() => setSelectedTask(task)} />)}
                  {columns.TODO.length === 0 && <EmptyColumn />}
                </div>
              </motion.div>
              {/* IN PROGRESS Column */}
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center space-x-2 px-1">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">In Progress</h2>
                  <Badge variant="secondary">{columns.IN_PROGRESS.length}</Badge>
                </div>
                <div className="space-y-3 h-full">
                  {columns.IN_PROGRESS.map(task => <TaskCard key={task.id} task={task} onStatusClick={() => setSelectedTask(task)} />)}
                  {columns.IN_PROGRESS.length === 0 && <EmptyColumn />}
                </div>
              </motion.div>
              {/* DONE Column */}
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center space-x-2 px-1">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h2 className="text-lg font-semibold">Done</h2>
                  <Badge variant="secondary">{columns.DONE.length}</Badge>
                </div>
                <div className="space-y-3 h-full">
                  {columns.DONE.map(task => <TaskCard key={task.id} task={task} onStatusClick={() => setSelectedTask(task)} />)}
                  {columns.DONE.length === 0 && <EmptyColumn />}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          <CreateTaskDialog isOpen={isCreateTaskOpen} onClose={() => setIsCreateTaskOpen(false)} onSubmit={handleTaskCreate} projectId={projectId} />
          <TaskStatusDialog task={selectedTask} isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} onStatusUpdate={handleStatusUpdate} />
        </main>
      </div>
    </ProtectedRoute>
  )
}

const TaskCard = ({ task, onStatusClick }: { task: Task, onStatusClick: () => void }) => (
  <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="w-full">
    <Card onClick={onStatusClick} className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <p className="font-semibold mb-4">{task.title}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{formatRelativeTime(task.updatedAt)}</span>
          {task.assignee ? (
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">{getInitials(task.assignee.email)}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-7 w-7 rounded-full bg-muted border flex items-center justify-center">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const EmptyColumn = () => (
  <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
    <p className="text-sm text-muted-foreground">No tasks here</p>
  </div>
);