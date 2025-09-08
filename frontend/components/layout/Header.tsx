'use client'

import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Settings, Feather } from 'lucide-react'
import { getInitials, getRoleColor } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'

export function Header() {
  const { user, logout } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout()
  }

  if (!user) return null

  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.15, ease: 'easeIn' } }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
            <Feather className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-bold">MainApp</h1>
        </Link>

        <div className="flex items-center space-x-4">
          <Badge variant="outline" className={`${getRoleColor(user.role)} font-semibold`}>
            {user.role}
          </Badge>
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border-2 border-transparent hover:border-primary transition-colors">
                    <AvatarFallback className="text-sm">
                      {getInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <AnimatePresence>
              {isOpen && (
                <DropdownMenuContent 
                  asChild 
                  className="w-56" 
                  align="end" 
                  forceMount
                >
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={dropdownVariants}
                  >
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Signed in as</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </motion.div>
                </DropdownMenuContent>
              )}
            </AnimatePresence>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}