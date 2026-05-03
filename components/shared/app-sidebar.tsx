'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  Truck,
  Users,
  CreditCard,
  BarChart3,
  UserCog,
  Settings,
  Files,
  Store,
  LogOut,
  ChevronDown,
  Building2,
  ShieldCheck,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useBusinessFeatures } from '@/lib/hooks/use-business-features';
import {
  mainNavItems,
  financeNavItems,
  managementNavItems,
  type NavItem,
} from '@/lib/config/navigation';
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
import { useI18n } from '@/lib/i18n/use-i18n';
import { getFullImageUrl } from '@/lib/utils';

export function AppSidebar() {
  const pathname = usePathname();
  const { user, company, logout } = useAuthStore();
  const features = useBusinessFeatures();
  const { t } = useI18n();

  const isActive = (url: string, hasChildren?: boolean) => {
    if (hasChildren) {
      return pathname.startsWith(url);
    }
    return pathname === url;
  };

  const filterNavItems = (items: NavItem[]) => {
    return items
      .filter((item) => {
        // Check role requirements for parent
        if (item.roles && user && !item.roles.includes(user.role)) {
          return false;
        }
        // Check feature requirements
        if (item.requiresFeature && !features[item.requiresFeature]) {
          return false;
        }
        return true;
      })
      .map((item) => {
        // Filter children if they exist
        if (item.children) {
          return {
            ...item,
            children: item.children.filter((child) => {
              if (child.roles && user && !child.roles.includes(user.role)) {
                return false;
              }
              return true;
            }),
          };
        }
        return item;
      })
      .filter((item) => {
        // If it had children but they are all filtered out, and it's a grouping item, maybe hide it?
        // Actually, if it has a URL, we should probably keep it.
        // But for items like "Finance" which are purely containers, if children are 0, hide.
        if (item.children && item.children.length === 0 && !item.url.includes('/dashboard/')) {
           // This is a bit tricky. For now, let's just ensure if children are present, they are filtered.
        }
        return true;
      });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBusinessTypeLabel = (types: string[] | string | null) => {
    const labels: Record<string, string> = {
      retail: 'Retail Store',
      pharmacy: 'Pharmacy',
      building: 'Building Materials',
      wholesale: 'Wholesale',
    };
    if (Array.isArray(types)) {
      return types.map(t => labels[t] || t).join(' + ');
    }
    return labels[types || 'retail'] || 'Business';
  };

  const translateLabel = (label: string) => {
    const map: Record<string, string> = {
      'Dashboard': t('sidebar.dashboard'),
      'POS': t('sidebar.pos'),
      'Inventory': t('sidebar.inventory'),
      'Products': t('sidebar.products'),
      'Categories': t('sidebar.categories'),
      'Stock Adjustment': t('sidebar.stockAdjustment'),
      'Sales': t('sidebar.sales'),
      'Transactions': t('sidebar.transactions'),
      'Returns': t('sidebar.returns'),
      'Purchases': t('sidebar.purchases'),
      'Orders': t('sidebar.orders'),
      'Suppliers': t('sidebar.suppliers'),
      'Customers': t('sidebar.customers'),
      'Calendar': t('sidebar.calendar'),
      'Credits': t('sidebar.credits'),
      'Receivables': t('sidebar.receivables'),
      'Payables': t('sidebar.payables'),
      'Documents': t('sidebar.documents'),
      'All Documents': t('sidebar.allDocuments'),
      'Reports': t('sidebar.reports'),
      'Sales Report': t('sidebar.salesReport'),
      'Inventory Report': t('sidebar.inventoryReport'),
      'Financial Report': t('sidebar.financialReport'),
      'Customer Report': t('sidebar.customerReport'),
      'Staff': t('sidebar.staff'),
      'Settings': t('common.settings'),
      'General': t('sidebar.general'),
      'Company': t('sidebar.company'),
      'Finance': t('sidebar.finance'),
      'Management': t('sidebar.management'),
      'Company Settings': t('sidebar.companySettings'),
      'Super Admin': t('sidebar.superAdmin'),
      'Logout': t('common.logout'),
    };
    return map[label] || label;
  };

  return (
    <Sidebar className="w-72 border-r border-sidebar-border/80">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar/95 px-4 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full rounded-2xl border border-sidebar-border/70 px-3 py-3 shadow-sm">
                  <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
                    {company?.logo ? (
                      <img src={getFullImageUrl(company.logo)} alt={company.name} className="h-full w-full object-contain p-1 bg-white" />
                    ) : (
                      <Store className="size-4" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 text-left leading-tight">
                    <span className="truncate text-base font-bold">
                      {company?.name || 'My Business'}
                    </span>
                    <span className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/60">
                      {getBusinessTypeLabel(company?.types || ['retail'])}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4.5" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width]"
                align="start"
              >
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings/company">
                    <Building2 className="mr-2 size-4" />
                    {translateLabel('Company Settings')}
                  </Link>
                </DropdownMenuItem>
                {user?.role === 'super_admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <ShieldCheck className="mr-2 size-4" />
                      {translateLabel('Super Admin')}
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-3 py-3">
          <SidebarGroupLabel className="mb-3 rounded-xl bg-sidebar-accent/40 px-4 py-5 text-[11px] font-black uppercase tracking-[0.22em] text-sidebar-foreground">{t('sidebar.mainMenu')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterNavItems(mainNavItems).map((item) =>
                item.children ? (
                  <Collapsible
                    key={item.title}
                    defaultOpen={isActive(item.url, true)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={translateLabel(item.title)}
                          isActive={isActive(item.url, true)}
                          className="min-h-12 rounded-2xl border border-transparent px-4 py-3 text-[15px] font-semibold shadow-sm transition-all hover:border-sidebar-border/80 hover:shadow-md data-[active=true]:border-sidebar-primary/20 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                        >
                          <item.icon className="size-5" />
                          <span>{translateLabel(item.title)}</span>
                          <ChevronDown className="ml-auto size-4.5 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === child.url}
                                className="min-h-10 rounded-xl px-3 text-sm font-medium"
                              >
                                <Link href={child.url}>{translateLabel(child.title)}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={translateLabel(item.title)}
                      isActive={isActive(item.url)}
                      className="min-h-12 rounded-2xl border border-transparent px-4 py-3 text-[15px] font-semibold shadow-sm transition-all hover:border-sidebar-border/80 hover:shadow-md data-[active=true]:border-sidebar-primary/20 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                    >
                      <Link href={item.url}>
                        <item.icon className="size-5" />
                        <span>{translateLabel(item.title)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="px-3 py-3">
          <SidebarGroupLabel className="mb-3 rounded-xl bg-sidebar-accent/40 px-4 py-5 text-[11px] font-black uppercase tracking-[0.22em] text-sidebar-foreground">{t('sidebar.finance')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterNavItems(financeNavItems).map((item) =>
                item.children ? (
                  <Collapsible
                    key={item.title}
                    defaultOpen={isActive(item.url, true)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={translateLabel(item.title)}
                          isActive={isActive(item.url, true)}
                          className="min-h-12 rounded-2xl border border-transparent px-4 py-3 text-[15px] font-semibold shadow-sm transition-all hover:border-sidebar-border/80 hover:shadow-md data-[active=true]:border-sidebar-primary/20 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                        >
                          <item.icon className="size-5" />
                          <span>{translateLabel(item.title)}</span>
                          <ChevronDown className="ml-auto size-4.5 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === child.url}
                                className="min-h-10 rounded-xl px-3 text-sm font-medium"
                              >
                                <Link href={child.url}>{translateLabel(child.title)}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={translateLabel(item.title)}
                      isActive={isActive(item.url)}
                      className="min-h-12 rounded-2xl border border-transparent px-4 py-3 text-[15px] font-semibold shadow-sm transition-all hover:border-sidebar-border/80 hover:shadow-md data-[active=true]:border-sidebar-primary/20 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                    >
                      <Link href={item.url}>
                        <item.icon className="size-5" />
                        <span>{translateLabel(item.title)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="px-3 py-3">
          <SidebarGroupLabel className="mb-3 rounded-xl bg-sidebar-accent/40 px-4 py-5 text-[11px] font-black uppercase tracking-[0.22em] text-sidebar-foreground">{t('sidebar.management')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterNavItems(managementNavItems).map((item) =>
                item.children ? (
                  <Collapsible
                    key={item.title}
                    defaultOpen={isActive(item.url, true)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={translateLabel(item.title)}
                          isActive={isActive(item.url, true)}
                          className="min-h-12 rounded-2xl border border-transparent px-4 py-3 text-[15px] font-semibold shadow-sm transition-all hover:border-sidebar-border/80 hover:shadow-md data-[active=true]:border-sidebar-primary/20 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                        >
                          <item.icon className="size-5" />
                          <span>{translateLabel(item.title)}</span>
                          <ChevronDown className="ml-auto size-4.5 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === child.url}
                                className="min-h-10 rounded-xl px-3 text-sm font-medium"
                              >
                                <Link href={child.url}>{translateLabel(child.title)}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={translateLabel(item.title)}
                      isActive={isActive(item.url)}
                      className="min-h-12 rounded-2xl border border-transparent px-4 py-3 text-[15px] font-semibold shadow-sm transition-all hover:border-sidebar-border/80 hover:shadow-md data-[active=true]:border-sidebar-primary/20 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                    >
                      <Link href={item.url}>
                        <item.icon className="size-5" />
                        <span>{translateLabel(item.title)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border bg-sidebar/95 px-4 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full rounded-2xl border border-sidebar-border/70 px-3 py-3 shadow-sm">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                      {user ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col gap-1 text-left leading-tight">
                    <span className="truncate text-sm font-semibold">
                      {user?.name || t('common.user')}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/70">
                      {user?.email || 'user@example.com'}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4.5" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width]"
                align="start"
                side="top"
              >
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 size-4" />
                    {translateLabel('Settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  {translateLabel('Logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
