"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { UtensilsCrossed, ChefHat, ReceiptText, Settings, PackageOpen, Coffee, BarChart3, PanelLeft, Wallet, User, LogOut } from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarFooter,
  SidebarProvider, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { canAccess, Role } from '@/lib/roles';
import { useRestaurant } from '@/context/RestaurantContext';

const mainNav = [
  { path: '/', label: 'Dine-In', icon: UtensilsCrossed },
  { path: '/takeaway', label: 'Take Away', icon: PackageOpen },
  { path: '/tea-snacks', label: 'Tea & Snacks', icon: Coffee },
  { path: '/kitchen', label: 'Kitchen', icon: ChefHat },
  { path: '/counter', label: 'Counter', icon: ReceiptText },
];

const adminNav = [
  { path: '/statistics', label: 'Statistics', icon: BarChart3 },
  { path: '/expenses', label: 'Expenses', icon: Wallet },
  { path: '/profile', label: 'Personal Info', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
];

function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const pathname = usePathname();
  const { navBadges, markPageActive } = useRestaurant();
  const [role, setRole] = useState<Role | undefined>(undefined);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.user?.role) setRole(d.user.role); })
      .catch(() => {});
  }, []);

  // Clear the badge for whatever page the user is currently on.
  useEffect(() => { markPageActive(pathname); }, [pathname, markPageActive]);

  const visibleMain = mainNav.filter((n) => canAccess(role, n.path));
  const visibleAdmin = adminNav.filter((n) => canAccess(role, n.path));

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const renderItem = ({ path, label, icon: Icon }: { path: string; label: string; icon: typeof UtensilsCrossed }) => {
    const count = navBadges[path] || 0;
    const show = count > 0 && pathname !== path;
    return (
      <SidebarMenuItem key={path}>
        <SidebarMenuButton asChild tooltip={label}>
          <NavLink to={path} end className="relative hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-primary font-semibold" onClick={handleNavClick}>
            <Icon className="h-4 w-4" />
            {!collapsed && <span>{label}</span>}
            {show && !collapsed && (
              <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {count}
              </span>
            )}
            {show && collapsed && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-destructive" />
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3" onClick={handleNavClick}>
          <img src="/logo.png" alt="Spicy Ocean" className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gradient leading-tight truncate">Spicy Ocean</h1>
              <p className="text-[10px] text-sidebar-foreground/60 truncate">Biggest Open Kitchen in Beach Road</p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {visibleMain.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleMain.map(renderItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleAdmin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdmin.map(renderItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <p className="text-[10px] text-sidebar-foreground/40 text-center">© 2026 Spicy Ocean</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/login');
      router.refresh();
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border bg-card px-4 gap-3">
            <SidebarTrigger />
            <span className="text-sm font-medium text-muted-foreground md:hidden">Spicy Ocean</span>
            <button
              onClick={handleLogout}
              className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
