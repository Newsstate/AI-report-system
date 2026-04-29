'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  PlusCircle,
  Settings,
  Zap,
  BarChart3,
  ChevronRight,
  LogOut,
  Bell,
  Moon,
  Sun,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Clients',
    href: '/clients',
    icon: Users,
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: FileText,
  },
  {
    title: 'New Report',
    href: '/new-report',
    icon: PlusCircle,
    highlight: true,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

interface SidebarProps {
  user?: {
    email?: string;
    full_name?: string;
    agency_name?: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card/50 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-lg shadow-brand-600/30">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight">SEO Platform</span>
          <span className="block text-[10px] text-muted-foreground">AI Powered</span>
        </div>
      </div>

      {/* Agency info */}
      {user?.agency_name && (
        <div className="border-b px-6 py-3">
          <p className="text-xs text-muted-foreground">Agency</p>
          <p className="truncate text-sm font-medium">{user.agency_name}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                  : item.highlight
                    ? 'border border-dashed border-brand-300 text-brand-600 hover:border-brand-500 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-400 dark:hover:bg-brand-950'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              {item.title}
              {isActive && <ChevronRight className="ml-auto h-3 w-3 text-white/70" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t p-3 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>

        {/* User info */}
        <div className="mt-2 rounded-lg border bg-muted/40 px-3 py-2">
          <p className="truncate text-xs font-medium">{user?.full_name || 'User'}</p>
          <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
        </div>
      </div>
    </aside>
  );
}
