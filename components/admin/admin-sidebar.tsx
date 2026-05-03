'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Megaphone,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronDown,
  LogOut,
  Store,
  Activity,
  FileText,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  children?: { title: string; url: string }[];
}

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Companies',
    url: '/admin/companies',
    icon: Building2,
    children: [
      { title: 'All Companies', url: '/admin/companies' },
      { title: 'Create New', url: '/admin/companies/new' },
      { title: 'Pending Approval', url: '/admin/companies/pending' },
    ],
  },
  {
    title: 'Users',
    url: '/admin/users',
    icon: Users,
    children: [
      { title: 'All Users', url: '/admin/users' },
      { title: 'Admins', url: '/admin/users/admins' },
      { title: 'Activity Log', url: '/admin/users/activity' },
    ],
  },
  {
    title: 'Subscriptions',
    url: '/admin/subscriptions',
    icon: CreditCard,
    children: [
      { title: 'All Plans', url: '/admin/subscriptions' },
      { title: 'Billing History', url: '/admin/subscriptions/billing' },
      { title: 'Revenue', url: '/admin/subscriptions/revenue' },
    ],
  },
  {
    title: 'Advertisements',
    url: '/admin/ads',
    icon: Megaphone,
    children: [
      { title: 'All Ads', url: '/admin/ads' },
      { title: 'Create Ad', url: '/admin/ads/new' },
      { title: 'Analytics', url: '/admin/ads/analytics' },
    ],
  },
];

const systemNavItems: NavItem[] = [
  {
    title: 'Analytics',
    url: '/admin/analytics',
    icon: BarChart3,
    children: [
      { title: 'Overview', url: '/admin/analytics' },
      { title: 'Sales Trends', url: '/admin/analytics/sales' },
      { title: 'User Activity', url: '/admin/analytics/users' },
    ],
  },
  {
    title: 'System',
    url: '/admin/system',
    icon: Activity,
    children: [
      { title: 'Health', url: '/admin/system' },
      { title: 'Logs', url: '/admin/system/logs' },
      { title: 'Notifications', url: '/admin/system/notifications' },
    ],
  },
  {
    title: 'Reports',
    url: '/admin/reports',
    icon: FileText,
  },
  {
    title: 'Settings',
    url: '/admin/settings',
    icon: Settings,
    children: [
      { title: 'General', url: '/admin/settings' },
      { title: 'Email', url: '/admin/settings/email' },
      { title: 'Security', url: '/admin/settings/security' },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const isActive = (url: string, hasChildren?: boolean) => {
    if (hasChildren) {
      return pathname.startsWith(url);
    }
    return pathname === url;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar side="right" variant="sidebar" className="w-72 border-l border-white/10">
      <SidebarHeader className="border-b border-white/10 bg-slate-900/50 px-5 py-6">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="w-full cursor-default rounded-2xl border border-white/10 bg-white/5 px-3 py-3 hover:bg-white/5 active:bg-white/5">
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg">
                <ShieldCheck className="size-5.5" />
              </div>
              <div className="ml-3 flex flex-1 flex-col gap-1 text-left">
                <span className="text-lg font-bold leading-tight text-white">Super Admin</span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Management Panel</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="space-y-6 px-4 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 rounded-xl bg-white/5 px-4 py-5 text-[11px] font-black uppercase tracking-[0.22em] text-white/60">Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {mainNavItems.map((item) => (
                <React.Fragment key={item.title}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild={!item.children}
                      tooltip={item.title}
                      isActive={isActive(item.url, !!item.children)}
                      className="flex min-h-13 items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-[15px] font-semibold text-white/75 shadow-sm transition-all duration-150 hover:border-white/10 hover:bg-white/6 hover:text-white hover:shadow-md data-[active=true]:border-indigo-400/20 data-[active=true]:bg-indigo-600 data-[active=true]:text-white"
                    >
                      <Link href={item.url} className="flex items-center w-full">
                        <item.icon className="mr-3 size-5 shrink-0" />
                        <span className="flex-1">{item.title}</span>
                        {item.children && <ChevronDown className="ml-auto size-4.5 transition-transform group-data-[state=open]/collapsible:rotate-180" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {item.children && (
                    <div className="mt-1 mb-2 ml-4 space-y-1 border-l border-white/10 pl-4">
                      {item.children.map((child) => (
                        <Link 
                          key={child.url}
                          href={child.url}
                          className={cn(
                            "block rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                            pathname === child.url 
                              ? "bg-indigo-600/40 text-white" 
                              : "text-white/50 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 rounded-xl bg-white/5 px-4 py-5 text-[11px] font-black uppercase tracking-[0.22em] text-white/55">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {systemNavItems.map((item) => (
                <React.Fragment key={item.title}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild={!item.children}
                      tooltip={item.title}
                      isActive={isActive(item.url, !!item.children)}
                      className="flex min-h-12 items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-[15px] font-semibold text-white/75 shadow-sm transition-all duration-150 hover:border-white/10 hover:bg-white/6 hover:text-white hover:shadow-md data-[active=true]:border-indigo-400/15 data-[active=true]:bg-indigo-600/20 data-[active=true]:text-indigo-300"
                    >
                      <Link href={item.url} className="flex items-center w-full">
                        <item.icon className="mr-3 size-5 shrink-0 opacity-80 group-hover:opacity-100" />
                        <span className="flex-1">{item.title}</span>
                        {item.children && <ChevronDown className="ml-auto size-4 opacity-50" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {item.children && isActive(item.url, true) && (
                    <div className="mt-1 mb-1.5 ml-3 space-y-1 border-l border-white/5 pl-4">
                      {item.children.map((child) => (
                        <Link 
                          key={child.url}
                          href={child.url}
                          className={cn(
                            "block rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                            pathname === child.url 
                              ? "bg-indigo-600/30 text-white" 
                              : "text-white/40 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 rounded-xl bg-white/5 px-4 py-5 text-[11px] font-black uppercase tracking-[0.22em] text-white/55">
            Quick Actions
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Back to Shop" className="flex min-h-12 items-center gap-3 rounded-2xl border border-emerald-500/10 px-4 py-3 text-[15px] font-semibold text-emerald-300/80 transition-all duration-150 hover:bg-emerald-500/10 hover:text-emerald-300">
                  <Link href="/dashboard">
                    <Store className="mr-3 size-5" />
                    <span>Back to Shop</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/5 bg-black/20 px-4 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full rounded-2xl border border-white/10 px-3 py-3 transition-colors hover:bg-white/5">
                  <Avatar className="size-10 border border-violet-500/30">
                    <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-700 text-xs font-bold text-white">
                      {user ? getInitials(user.name) : 'SA'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3 flex flex-1 flex-col gap-1 overflow-hidden text-left">
                    <span className="truncate text-sm font-semibold text-white/90">
                      {user?.name || 'Super Admin'}
                    </span>
                    <span className="truncate text-xs font-medium text-white/45">
                      {user?.email || 'admin@system.com'}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4 text-white/30" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-slate-900 border-white/10 text-white"
                align="end"
                side="top"
              >
                <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                  <Link href="/admin/settings" className="flex items-center w-full">
                    <Settings className="mr-2 size-4 opacity-70" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                  <Link href="/admin/system/notifications" className="flex items-center w-full">
                    <Bell className="mr-2 size-4 opacity-70" />
                    <span>Notifications</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                >
                  <LogOut className="mr-2 size-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
