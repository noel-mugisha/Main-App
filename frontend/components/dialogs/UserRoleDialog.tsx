'use client'

import { useState, useEffect } from 'react'
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
import { getRoleColor, getInitials } from '@/lib/utils'
import { Shield, Users, User as UserIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { cn } from '@/lib/utils'

interface User {
  id: number
  email: string
  role: 'USER' | 'MANAGER' | 'ADMIN'
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

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role)
    }
  }, [user])

  if (!user) return null

  const roleOptions = [
    {
      value: 'USER' as const,
      label: 'User',
      icon: UserIcon,
      description: 'Can view projects and update their assigned tasks.',
    },
    {
      value: 'MANAGER' as const,
      label: 'Manager',
      icon: Users,
      description: 'Can create projects and manage tasks within them.',
    },
    {
      value: 'ADMIN' as const,
      label: 'Admin',
      icon: Shield,
      description: 'Has full system access, including user management.',
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage User Role</DialogTitle>
          <DialogDescription>
            Assign a new role to the user below.
          </DialogDescription>
        </DialogHeader>

        <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
        >
          {/* User Info */}
          <div className="p-4 border rounded-lg bg-muted/50 flex items-center space-x-4">
            <Avatar>
              <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.email}</p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Current role:</span>
                <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
              </div>
            </div>
          </div>

          {/* New Role Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select a new role</label>
            <div className="grid grid-cols-1 gap-2">
              {roleOptions.map((option) => {
                const Icon = option.icon
                const isSelected = selectedRole === option.value
                
                return (
                  <motion.button
                    key={option.value}
                    onClick={() => setSelectedRole(option.value)}
                    className={cn(
                      'w-full p-3 text-left border rounded-lg transition-all duration-200 flex items-center space-x-4',
                      isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary'
                        : 'border-border hover:bg-accent'
                    )}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className={cn('h-6 w-6', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                    <div>
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </motion.div>

        <DialogFooter className="pt-4">
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