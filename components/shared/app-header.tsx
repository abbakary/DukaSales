'use client';

import { Bell, Search, Wifi, WifiOff, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useSyncStore } from '@/lib/stores/sync-store';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n/use-i18n';

import { CloseShiftDialog } from '@/components/dashboard/close-shift-dialog';

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { isOnline, pendingCount, isSyncing } = useSyncStore();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useI18n();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-sidebar text-sidebar-foreground px-4">
      <SidebarTrigger className="-ml-1 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
      <Separator orientation="vertical" className="mr-2 h-4 bg-sidebar-border" />
      
      {title && (
        <h1 className="text-lg font-semibold">{title}</h1>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-sidebar-foreground/60" />
          <Input
            type="search"
            placeholder={t('common.search')}
            className="w-64 pl-8 bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus-visible:ring-sidebar-ring"
          />
        </div>

        {/* Close Shift */}
        <CloseShiftDialog />

        {/* Online/Offline Status */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isOnline ? 'text-success' : 'text-destructive'
                )}
              >
                {isOnline ? (
                  <Wifi className="size-4" />
                ) : (
                  <WifiOff className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isOnline ? t('header.online') : t('header.offline')}
                {pendingCount > 0 && ` (${pendingCount} ${t('header.pending')})`}
                {isSyncing && ` - ${t('header.syncing')}`}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
            >
              <Bell className="size-4" />
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 size-5 rounded-full p-0 text-xs"
              >
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="font-semibold">{t('header.notifications')}</span>
              <Button variant="ghost" size="sm" className="text-xs">
                {t('header.markAllRead')}
              </Button>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <div className="p-4 text-center text-sm text-muted-foreground">
                {t('header.noNewNotifications')}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-semibold">
              {language.toUpperCase()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLanguage('en')}>{t('common.english')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('sw')}>{t('common.swahili')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-4 bg-sidebar-border mx-1" />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t('header.toggleTheme')}</span>
        </Button>
      </div>
    </header>
  );
}
