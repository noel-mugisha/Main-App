'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import useSWR from 'swr'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CreateTaskDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { title: string; assigneeId?: number }) => void
}

interface FormData {
  title: string
  assigneeId: string
}

interface User {
  id: number
  email: string
  role: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function CreateTaskDialog({ isOpen, onClose, onSubmit }: CreateTaskDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<FormData>()

  const watchedTitle = watch('title', '')

  // Fetch users for assignment
  const { data: usersData } = useSWR('/api/backend/admin/users?limit=100', fetcher)
  const users: User[] = usersData?.data?.users || []

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit({
        title: data.title.trim(),
        assigneeId: data.assigneeId ? parseInt(data.assigneeId) : undefined
      })
      reset()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to this project. You can assign it to a team member or leave it unassigned.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              {...register('title', {
                required: 'Task title is required',
                minLength: {
                  value: 3,
                  message: 'Task title must be at least 3 characters'
                },
                maxLength: {
                  value: 200,
                  message: 'Task title must be less than 200 characters'
                }
              })}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigneeId">Assign To</Label>
            <Select onValueChange={(value) => setValue('assigneeId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team member (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <span>{user.email}</span>
                      <span className="text-xs text-muted-foreground">({user.role})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Leave unassigned to assign later
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !watchedTitle.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
