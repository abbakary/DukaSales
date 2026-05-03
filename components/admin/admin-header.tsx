'use client';

import { Bell, Search, Moon, Sun, RefreshCcw } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface AdminHeaderProps {
  title?: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-gradient-to-r from-violet-50/50 to-indigo-50/50 px-4 dark:from-violet-950/20 dark:to-indigo-950/20">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold bg-gradient-to-r from-violet-700 to-indigo-700 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
          {title || 'Dashboard'}
        </h1>
      </div>
      
      <div className="ml-auto flex items-center gap-2">
        {/* Global Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search companies, users..."
            className="w-72 pl-8 bg-white/50 dark:bg-black/20 border-violet-200 dark:border-violet-800"
          />
        </div>

        {/* Refresh */}
        <Button variant="ghost" size="icon">
          <RefreshCcw className="size-4" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-4" />
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 size-5 rounded-full p-0 text-xs"
              >
                5
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="font-semibold">System Notifications</span>
              <Button variant="ghost" size="sm" className="text-xs">
                Clear all
              </Button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-4">
                <span className="font-medium">New Company Registration</span>
                <span className="text-sm text-muted-foreground">
                  Tech Solutions Inc. registered and awaiting approval
                </span>
                <span className="text-xs text-muted-foreground">5 minutes ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-4">
                <span className="font-medium">Subscription Upgrade</span>
                <span className="text-sm text-muted-foreground">
                  Best Pharmacy upgraded to Pro plan
                </span>
                <span className="text-xs text-muted-foreground">30 minutes ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-4">
                <span className="font-medium">System Alert</span>
                <span className="text-sm text-muted-foreground">
                  Database backup completed successfully
                </span>
                <span className="text-xs text-muted-foreground">1 hour ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-4">
                <span className="font-medium">Payment Received</span>
                <span className="text-sm text-muted-foreground">
                  TSh 299 subscription payment from Hardware World
                </span>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-4">
                <span className="font-medium">Ad Campaign Ended</span>
                <span className="text-sm text-muted-foreground">
                  Summer sale ad campaign has ended
                </span>
                <span className="text-xs text-muted-foreground">3 hours ago</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
