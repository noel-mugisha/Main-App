"use client"

import type React from "react"

import { useState, useRef } from "react"
import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import api, { apiEndpoints } from "@/lib/api"
import { formatRelativeTime } from "@/lib/utils"
import { CheckCircle, Clock, CircleDot, Folder } from "lucide-react"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { Skeleton } from "../ui/skeleton"
import { cn } from "@/lib/utils"

// --- Type Definitions ---
interface Task {
  id: number
  title: string
  status: "TODO" | "IN_PROGRESS" | "DONE"
  project: {
    id: number
    name: string
  }
  createdAt: string
  updatedAt: string
}
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE"

const secureFetcher = (url: string) => api.get(url).then((res) => res.data.data)

// --- Animation Variants ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
}
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
}

const dragVariants: Variants = {
  hover: {
    scale: 1.02,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
}

// --- Skeleton Loader Component ---
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
)

// --- Main Dashboard Component ---
export function UserDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [draggingTask, setDraggingTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)
  const columnRefs = useRef<Record<TaskStatus, HTMLDivElement | null>>({
    TODO: null,
    IN_PROGRESS: null,
    DONE: null,
  })

  const { error, mutate, isLoading } = useSWR<Task[]>("/api/tasks", secureFetcher, {
    onSuccess: (data) => setTasks(data),
  })

  const getColumnFromPosition = (x: number, y: number): TaskStatus | null => {
    // Check each column to see if the point is within its bounds
    for (const [status, ref] of Object.entries(columnRefs.current) as [TaskStatus, HTMLDivElement | null][]) {
      if (ref) {
        const rect = ref.getBoundingClientRect()
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          return status
        }
      }
    }
    return null
  }

  const handleDrop = async (newStatus: TaskStatus) => {
    if (!draggingTask || draggingTask.status === newStatus) {
      setDraggingTask(null)
      setDragOverColumn(null)
      return
    }

    // Create the optimistic state
    const updatedTasks = tasks.map((task) =>
      task.id === draggingTask.id ? { ...task, status: newStatus, updatedAt: new Date().toISOString() } : task,
    )
    setTasks(updatedTasks)

    try {
      // Trigger remote mutation
      await mutate(
        async () => {
          const response = await apiEndpoints.updateTaskStatus(draggingTask.id!, newStatus)
          const returnedUpdatedTask = response.data.data
          return tasks.map((t) => (t.id === returnedUpdatedTask.id ? returnedUpdatedTask : t))
        },
        {
          optimisticData: updatedTasks,
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        },
      )
    } catch (error) {
      console.error("[v0] Failed to update task status:", error)
    } finally {
      setDraggingTask(null)
      setDragOverColumn(null)
    }
  }

  const handleDragStart = (task: Task) => {
    setDraggingTask(task)
  }

  const handleDragEnd = (event: any, info: any) => {
    const { point } = info
    const targetColumn = getColumnFromPosition(point.x, point.y)
    
    if (targetColumn && draggingTask && targetColumn !== draggingTask.status) {
      handleDrop(targetColumn)
    } else {
      setDraggingTask(null)
      setDragOverColumn(null)
    }
  }

  const handleDrag = (event: any, info: any) => {
    const { point } = info
    const targetColumn = getColumnFromPosition(point.x, point.y)
    
    if (targetColumn && draggingTask && targetColumn !== draggingTask.status) {
      setDragOverColumn(targetColumn)
    } else {
      setDragOverColumn(null)
    }
  }

  const columns = {
    TODO: tasks.filter((task) => task.status === "TODO"),
    IN_PROGRESS: tasks.filter((task) => task.status === "IN_PROGRESS"),
    DONE: tasks.filter((task) => task.status === "DONE"),
  }

  if (isLoading && tasks.length === 0) return <UserDashboardSkeleton />
  if (error)
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading tasks.</p>
      </div>
    )

  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={containerVariants}>
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground">Drag and drop your tasks to update their status.</p>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {(Object.keys(columns) as TaskStatus[]).map((status) => (
          <Column
            key={status}
            status={status}
            tasks={columns[status]}
            draggingTask={draggingTask}
            dragOverColumn={dragOverColumn}
            columnRef={(el) => (columnRefs.current[status] = el)}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrag={handleDrag}
          />
        ))}
      </div>
    </motion.div>
  )
}

// --- Column Sub-component ---
const Column = ({
  status,
  tasks,
  draggingTask,
  dragOverColumn,
  columnRef,
  onDragStart,
  onDragEnd,
  onDrag,
}: {
  status: TaskStatus
  tasks: Task[]
  draggingTask: Task | null
  dragOverColumn: TaskStatus | null
  columnRef: (el: HTMLDivElement | null) => void
  onDragStart: (task: Task) => void
  onDragEnd: (event: any, info: any) => void
  onDrag: (event: any, info: any) => void
}) => {
  const columnDetails = {
    TODO: {
      icon: <CircleDot className="h-5 w-5 text-muted-foreground" />,
      title: "To Do",
      color: "text-muted-foreground",
    },
    IN_PROGRESS: { icon: <Clock className="h-5 w-5 text-blue-500" />, title: "In Progress", color: "text-blue-500" },
    DONE: { icon: <CheckCircle className="h-5 w-5 text-green-500" />, title: "Done", color: "text-green-500" },
  }
  const { icon, title, color } = columnDetails[status]

  const isDraggedOver = dragOverColumn === status
  const canDrop = draggingTask && draggingTask.status !== status

  return (
    <motion.div variants={itemVariants} className="space-y-4">
      <div className="flex items-center space-x-2 px-1">
        {icon}
        <h2 className={cn("text-lg font-semibold transition-colors", isDraggedOver && canDrop && color)}>{title}</h2>
        <Badge
          variant="secondary"
          className={cn("transition-colors", isDraggedOver && canDrop && "bg-primary/20 text-primary")}
        >
          {tasks.length}
        </Badge>
      </div>

      <motion.div
        ref={columnRef}
        className={cn(
          "space-y-3 p-4 rounded-xl transition-all duration-200 min-h-[200px] border-2",
          isDraggedOver && canDrop
            ? "bg-primary/5 border-primary/30 border-dashed shadow-inner"
            : "bg-muted/30 border-transparent",
          draggingTask && !canDrop && "opacity-50",
        )}
        animate={{
          scale: isDraggedOver && canDrop ? 1.02 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <AnimatePresence mode="popLayout">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDrag={onDrag}
                isDragging={draggingTask?.id === task.id}
              />
            ))
          ) : (
            <motion.div
              className={cn(
                "flex items-center justify-center h-32 border-2 border-dashed rounded-lg transition-colors",
                isDraggedOver && canDrop ? "border-primary/50 bg-primary/5" : "border-muted-foreground/20",
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p
                className={cn(
                  "text-sm transition-all duration-200 font-medium",
                  isDraggedOver && canDrop ? "text-primary scale-110" : "text-muted-foreground",
                )}
              >
                {isDraggedOver && canDrop ? "Drop task here" : "No tasks here"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// --- Task Card Sub-component ---
const TaskCard = ({
  task,
  onDragStart,
  onDragEnd,
  onDrag,
  isDragging,
}: {
  task: Task
  onDragStart: (task: Task) => void
  onDragEnd: (event: any, info: any) => void
  onDrag: (event: any, info: any) => void
  isDragging: boolean
}) => {
  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover="hover"
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.1}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
      onDragStart={() => onDragStart(task)}
      onDragEnd={onDragEnd}
      onDrag={onDrag}
      whileDrag={{
        scale: 1.05,
        rotate: 2,
        boxShadow: "0px 15px 30px rgba(0,0,0,0.15)",
        zIndex: 1000,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
      className={cn("w-full cursor-grab active:cursor-grabbing select-none", isDragging && "opacity-50")}
      style={{
        zIndex: isDragging ? 1000 : 1,
      }}
    >
      <motion.div variants={dragVariants}>
        <Card
          className={cn(
            "bg-background transition-all duration-200 border",
            isDragging ? "shadow-2xl border-primary/20" : "hover:shadow-md border-border hover:border-primary/20",
          )}
        >
          <CardContent className="p-4 space-y-3">
            <p className="font-semibold leading-snug text-balance">{task.title}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                <Folder className="h-3 w-3" />
                <span className="truncate" title={task.project.name}>
                  {task.project.name}
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                {formatRelativeTime(task.updatedAt)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}