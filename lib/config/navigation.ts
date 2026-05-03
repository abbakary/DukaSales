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
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarDays,
} from 'lucide-react';

export interface NavItem {
  title: string;
  url: string;
  icon: any; // Using any for icon to avoid complex type issues in shared config
  roles?: string[];
  requiresFeature?: string;
  children?: { title: string; url: string; icon?: any; roles?: string[] }[];
}

export const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'POS',
    url: '/pos',
    icon: ShoppingCart,
    roles: ['admin', 'manager', 'cashier'],
  },
  {
    title: 'Inventory',
    url: '/dashboard/inventory',
    icon: Package,
    roles: ['admin', 'manager'],
    children: [
      { title: 'Products', url: '/dashboard/inventory' },
      { title: 'Categories', url: '/dashboard/inventory/categories' },
      { title: 'Stock Adjustment', url: '/dashboard/inventory/adjustments' },
    ],
  },
  {
    title: 'Sales',
    url: '/dashboard/sales',
    icon: Receipt,
    roles: ['admin', 'manager', 'cashier'],
    children: [
      { title: 'Transactions', url: '/dashboard/sales' },
      { title: 'Returns', url: '/dashboard/sales/returns' },
    ],
  },
  {
    title: 'Purchases',
    url: '/dashboard/purchases',
    icon: Truck,
    roles: ['admin', 'manager'],
    children: [
      { title: 'Orders', url: '/dashboard/purchases' },
      { title: 'Suppliers', url: '/dashboard/purchases/suppliers' },
    ],
  },
  {
    title: 'Customers',
    url: '/dashboard/customers',
    icon: Users,
    roles: ['admin', 'manager', 'cashier'],
  },
  {
    title: 'Calendar',
    url: '/dashboard/calendar',
    icon: CalendarDays,
    roles: ['admin', 'manager', 'cashier'],
  },
  {
    title: 'Credits',
    url: '/dashboard/credits',
    icon: CreditCard,
    roles: ['admin', 'manager'],
    children: [
      { title: 'Receivables', url: '/dashboard/credits' },
      { title: 'Payables', url: '/dashboard/credits/payables' },
    ],
  },
  {
    title: 'Documents',
    url: '/dashboard/documents',
    icon: Files,
    roles: ['admin', 'manager'],
    children: [
      { title: 'All Documents', url: '/dashboard/documents' },
    ],
  },
  {
    title: 'Reports',
    url: '/dashboard/reports',
    icon: BarChart3,
    roles: ['admin', 'manager', 'cashier'],
    children: [
      { title: 'Sales Report', url: '/dashboard/reports/sales', roles: ['admin', 'manager', 'cashier'] },
      { title: 'Inventory Report', url: '/dashboard/reports/inventory', roles: ['admin', 'manager'] },
      { title: 'Financial Report', url: '/dashboard/reports/financial', roles: ['admin', 'manager'] },
      { title: 'Customer Report', url: '/dashboard/reports/customers', roles: ['admin', 'manager'] },
    ],
  },
];

export const financeNavItems: NavItem[] = [
  {
    title: 'Finance',
    url: '/dashboard/finance',
    icon: Coins,
    roles: ['admin', 'manager'],
    children: [
      { title: 'Staff Salaries', url: '/dashboard/finance/salaries', icon: ArrowUpRight },
      { title: 'Expenditures', url: '/dashboard/finance/expenditures', icon: ArrowDownLeft },
    ],
  },
];

export const managementNavItems: NavItem[] = [
  {
    title: 'Staff',
    url: '/dashboard/staff',
    icon: UserCog,
    roles: ['admin', 'manager'],
  },
  {
    title: 'Settings',
    url: '/dashboard/settings',
    icon: Settings,
    roles: ['admin', 'manager', 'cashier'],
    children: [
      { title: 'General', url: '/dashboard/settings', roles: ['admin', 'manager', 'cashier'] },
      { title: 'Company', url: '/dashboard/settings/company', roles: ['admin', 'manager'] },
      { title: 'Staff', url: '/dashboard/staff', roles: ['admin', 'manager'] },
    ],
  },
];

export const allNavItems = [...mainNavItems, ...financeNavItems, ...managementNavItems];
