"use client";

import React from 'react';
import Link from 'next/link';
import { UtensilsCrossed, ChefHat, ReceiptText, Settings, PackageOpen, Coffee, BarChart3, PanelLeft, Wallet, User } from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarFooter,
  SidebarProvider, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';

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

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
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
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map(({ path, label, icon: Icon }) => (
                <SidebarMenuItem key={path}>
                  <SidebarMenuButton asChild tooltip={label}>
                    <NavLink to={path} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-primary font-semibold" onClick={handleNavClick}>
                      <Icon className="h-4 w-4" />
                      {!collapsed && <span>{label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map(({ path, label, icon: Icon }) => (
                <SidebarMenuItem key={path}>
                  <SidebarMenuButton asChild tooltip={label}>
                    <NavLink to={path} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-primary font-semibold" onClick={handleNavClick}>
                      <Icon className="h-4 w-4" />
                      {!collapsed && <span>{label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border bg-card px-4 gap-3">
            <SidebarTrigger />
            <span className="text-sm font-medium text-muted-foreground md:hidden">Spicy Ocean</span>
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
