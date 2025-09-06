'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Circle } from 'lucide-react'

interface Task {
  id: number
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  project: {
    id: number
    name: string
  }
}

interface TaskStatusDialogProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onStatusUpdate: (taskId: number, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => void
}

export function TaskStatusDialog({ task, isOpen, onClose, onStatusUpdate }: TaskStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE'>('TODO')
  const [isUpdating, setIsUpdating] = useState(false)

  if (!task) return null

  const statusOptions = [
    {
      value: 'TODO' as const,
      label: 'To Do',
      icon: Circle,
      description: 'Task is not started yet',
      color: 'text-gray-500'
    },
    {
      value: 'IN_PROGRESS' as const,
      label: 'In Progress',
      icon: Clock,
      description: 'Task is currently being worked on',
      color: 'text-blue-500'
    },
    {
      value: 'DONE' as const,
      label: 'Done',
      icon: CheckCircle,
      description: 'Task has been completed',
      color: 'text-green-500'
    }
  ]

  const handleStatusUpdate = async () => {
    if (selectedStatus === task.status) {
      onClose()
      return
    }

    setIsUpdating(true)
    try {
      await onStatusUpdate(task.id, selectedStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  const currentStatusOption = statusOptions.find(option => option.value === task.status)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Task Status</DialogTitle>
          <DialogDescription>
            Update the status for "{task.title}" in project "{task.project.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div>
            <label className="text-sm font-medium mb-2 block">Current Status</label>
            <div className="flex items-center space-x-2">
              {currentStatusOption && (
                <>
                  <currentStatusOption.icon className={`h-4 w-4 ${currentStatusOption.color}`} />
                  <Badge variant="outline" className={currentStatusOption.color}>
                    {currentStatusOption.label}
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* New Status Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">New Status</label>
            <div className="space-y-2">
              {statusOptions.map((option) => {
                const Icon = option.icon
                const isSelected = selectedStatus === option.value
                
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedStatus(option.value)}
                    className={`w-full p-3 text-left border rounded-lg transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-4 w-4 ${option.color}`} />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button 
            onClick={handleStatusUpdate} 
            disabled={isUpdating || selectedStatus === task.status}
          >
            {isUpdating ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
