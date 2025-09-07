'use client'

import { useState } from 'react'
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import api from '@/lib/api'

interface FormData {
  title: string
  assigneeId: string
}

interface User {
  id: number
  email: string
  role: string
}

const assignableUsersFetcher = (url: string) => api.get(url).then(res => res.data.data.users);

export function CreateTaskDialog({ isOpen, onClose, onSubmit }: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { title: string; assigneeId?: number }) => void
}) {
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

  const { data: users, error: usersError } = useSWR<User[]>('/api/projects/assignable-users', assignableUsersFetcher)
  const isLoadingUsers = !users && !usersError;

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const assigneeId = data.assigneeId ? parseInt(data.assigneeId) : undefined;
      await onSubmit({
        title: data.title.trim(),
        assigneeId: assigneeId
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
                minLength: { value: 3, message: 'Title must be at least 3 characters' }
              })}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigneeId">Assign To</Label>
            <Select onValueChange={(value) => setValue('assigneeId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team member (optional)" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingUsers ? (
                  <SelectItem value="loading" disabled>Loading users...</SelectItem>
                ) : usersError ? (
                  <SelectItem value="error" disabled>Error loading users</SelectItem>
                ) : (
                  <SelectGroup>
                    <SelectLabel>Assignable Users</SelectLabel>
                    {/* The `users &&` check ensures we only map when the array exists */}
                    {users && users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <span>{user.email}</span>
                          {/* The role is not needed here since we only fetched USERs */}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only users with the 'USER' role are shown.
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