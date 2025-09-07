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

interface ApiResponse {
  success: boolean;
  data: {
    users: User[];
  };
}

const assignableUsersFetcher = async (url: string) => {
  try {
    console.log('Fetching users from:', url);
    const response = await api.get(url);
    console.log('Raw API Response:', response);
    
    // Log the complete response structure
    console.log('Response data structure:', {
      data: response.data,
      hasData: !!response.data,
      hasDataData: !!response.data?.data,
      hasUsers: !!response.data?.data?.users,
      isArray: Array.isArray(response.data?.data?.users)
    });
    
    // Handle the response structure from our backend
    // Our backend returns: { success: true, data: { users: [...] } }
    const users = response.data?.data?.users || [];
    
    console.log('Extracted users:', users);
    return { data: { users } }; // Return in the expected format for useSWR
  } catch (error) {
    throw error;
  }
};

export function CreateTaskDialog({ 
  isOpen, 
  onClose, 
  onSubmit,
  projectId 
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { title: string; assigneeId?: number }) => void
  projectId: number
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

  const { data: usersData, error: usersError, isLoading: isLoadingUsers } = useSWR<{ data: { users: User[] } }>(
    projectId ? `/api/projects/${projectId}/assignable-users` : null, 
    assignableUsersFetcher
  )
  
  // Extract users from the response data structure
  const users = usersData?.data?.users || [];
  console.log('Rendering users:', users); // Debug log

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      console.log('Form data:', data); // Debug log
      const assigneeId = data.assigneeId ? parseInt(data.assigneeId) : undefined;
      console.log('Submitting with assigneeId:', assigneeId); // Debug log
      
      await onSubmit({
        title: data.title.trim(),
        assigneeId: assigneeId
      });
      
      // Reset form after successful submission
      reset({
        title: '',
        assigneeId: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
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
            <Select 
              value={watch('assigneeId') || ''}
              onValueChange={(value) => setValue('assigneeId', value, { shouldValidate: true })}
            >
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
                    {users.length > 0 ? (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.email}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-users" disabled className="text-muted-foreground">
                        No assignable users found
                      </SelectItem>
                    )}
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