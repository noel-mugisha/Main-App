'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import api, { apiEndpoints } from '@/lib/api'
import { formatRelativeTime, getStatusColor } from '@/lib/utils'
import { CheckCircle, Clock, CircleDot, Folder } from 'lucide-react'
import { TaskStatusDialog } from '@/components/dialogs/TaskStatusDialog'
import { motion, Variants} from 'framer-motion'
import { Skeleton } from '../ui/skeleton'

interface Task {
  id: number
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  project: {
    id: number
    name: string
  }
  createdAt: string
  updatedAt: string
}

const secureFetcher = (url: string) => api.get(url).then(res => res.data.data);

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants : Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
};

// Skeleton Loader Component
const UserDashboardSkeleton = () => (
  <div className="space-y-6">
    <div>
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-5 w-72" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-3">
            <Card>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16 rounded-md" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16 rounded-md" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  </div>
);


export function UserDashboard() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const { data: tasks, error, mutate, isLoading } = useSWR<Task[]>('/api/tasks', secureFetcher)

  const handleStatusUpdate = async (taskId: number, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    try {
      await apiEndpoints.updateTaskStatus(taskId, newStatus)
      mutate() // Refresh data
      setSelectedTask(null)
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const columns = {
    TODO: tasks?.filter(task => task.status === 'TODO') || [],
    IN_PROGRESS: tasks?.filter(task => task.status === 'IN_PROGRESS') || [],
    DONE: tasks?.filter(task => task.status === 'DONE') || [],
  }

  if (isLoading) {
    return <UserDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading your tasks. Please try again.</p>
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground">
          Here are all the tasks assigned to you. Click a task to update its status.
        </p>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
        variants={containerVariants}
      >
        {/* TODO Column */}
        <Column title="To Do" icon={<CircleDot className="h-5 w-5 text-muted-foreground" />} tasks={columns.TODO} onTaskSelect={setSelectedTask} />
        {/* IN PROGRESS Column */}
        <Column title="In Progress" icon={<Clock className="h-5 w-5 text-blue-500" />} tasks={columns.IN_PROGRESS} onTaskSelect={setSelectedTask} />
        {/* DONE Column */}
        <Column title="Done" icon={<CheckCircle className="h-5 w-5 text-green-500" />} tasks={columns.DONE} onTaskSelect={setSelectedTask} />
      </motion.div>

      <TaskStatusDialog
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onStatusUpdate={handleStatusUpdate}
      />
    </motion.div>
  )
}

// Sub-component for a Kanban column
const Column = ({ title, icon, tasks, onTaskSelect }: { title: string, icon: React.ReactNode, tasks: Task[], onTaskSelect: (task: Task) => void }) => (
  <motion.div variants={itemVariants} className="space-y-4">
    <div className="flex items-center space-x-2 px-1">
      {icon}
      <h2 className="text-lg font-semibold">{title}</h2>
      <Badge variant="secondary">{tasks.length}</Badge>
    </div>
    <div className="space-y-3 h-full bg-muted/50 p-2 rounded-lg">
      {tasks.length > 0 ? (
        tasks.map(task => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskSelect(task)} />
        ))
      ) : (
        <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">No tasks here</p>
        </div>
      )}
    </div>
  </motion.div>
);

// Sub-component for a Task Card
const TaskCard = ({ task, onClick }: { task: Task, onClick: () => void }) => (
  <motion.div
    layout
    variants={itemVariants}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="w-full"
  >
    <Card onClick={onClick} className="cursor-pointer bg-background hover:shadow-lg transition-shadow">
      <CardContent className="p-4 space-y-3">
        <p className="font-semibold leading-snug">{task.title}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
            <Folder className="h-3 w-3" />
            <span className="truncate" title={task.project.name}>{task.project.name}</span>
          </div>
          <Badge variant="outline" className="text-xs">{formatRelativeTime(task.updatedAt)}</Badge>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);