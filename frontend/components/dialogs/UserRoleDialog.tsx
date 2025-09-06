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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getRoleColor } from '@/lib/utils'
import { Shield, Users, User } from 'lucide-react'

interface User {
  id: number
  email: string
  role: 'USER' | 'MANAGER' | 'ADMIN'
  emailVerified: boolean
}

interface UserRoleDialogProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onRoleUpdate: (userId: number, newRole: 'USER' | 'MANAGER' | 'ADMIN') => void
}

export function UserRoleDialog({ user, isOpen, onClose, onRoleUpdate }: UserRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<'USER' | 'MANAGER' | 'ADMIN'>('USER')
  const [isUpdating, setIsUpdating] = useState(false)

  if (!user) return null

  const roleOptions = [
    {
      value: 'USER' as const,
      label: 'User',
      icon: User,
      description: 'Can view and update assigned tasks',
      color: 'text-green-500'
    },
    {
      value: 'MANAGER' as const,
      label: 'Manager',
      icon: Users,
      description: 'Can create projects and manage tasks',
      color: 'text-blue-500'
    },
    {
      value: 'ADMIN' as const,
      label: 'Admin',
      icon: Shield,
      description: 'Full system access and user management',
      color: 'text-red-500'
    }
  ]

  const handleRoleUpdate = async () => {
    if (selectedRole === user.role) {
      onClose()
      return
    }

    setIsUpdating(true)
    try {
      await onRoleUpdate(user.id, selectedRole)
    } finally {
      setIsUpdating(false)
    }
  }

  const currentRoleOption = roleOptions.find(option => option.value === user.role)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update User Role</DialogTitle>
          <DialogDescription>
            Change the role for user "{user.email}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-muted-foreground">
                  {user.emailVerified ? 'Verified' : 'Unverified'} account
                </p>
              </div>
              <Badge className={getRoleColor(user.role)}>
                {user.role}
              </Badge>
            </div>
          </div>

          {/* Current Role */}
          <div>
            <label className="text-sm font-medium mb-2 block">Current Role</label>
            <div className="flex items-center space-x-2">
              {currentRoleOption && (
                <>
                  <currentRoleOption.icon className={`h-4 w-4 ${currentRoleOption.color}`} />
                  <Badge variant="outline" className={currentRoleOption.color}>
                    {currentRoleOption.label}
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* New Role Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">New Role</label>
            <Select value={selectedRole} onValueChange={(value: 'USER' | 'MANAGER' | 'ADMIN') => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <Icon className={`h-4 w-4 ${option.color}`} />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Role Description */}
          {selectedRole && (
            <div className="p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center space-x-2 mb-1">
                {(() => {
                  const option = roleOptions.find(opt => opt.value === selectedRole)
                  const Icon = option?.icon
                  return Icon ? <Icon className={`h-4 w-4 ${option.color}`} /> : null
                })()}
                <span className="font-medium">
                  {roleOptions.find(opt => opt.value === selectedRole)?.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {roleOptions.find(opt => opt.value === selectedRole)?.description}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button 
            onClick={handleRoleUpdate} 
            disabled={isUpdating || selectedRole === user.role}
          >
            {isUpdating ? 'Updating...' : 'Update Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
