
"use client";

import { usePathname } from 'next/navigation';
import { BookOpen, Users, BarChart, MessageSquare, Settings, LogOut, PanelLeft, Calendar } from 'lucide-react';
import { Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/logo';
import { logout } from '@/lib/actions';
import { Button } from '../ui/button';

const menuItems = [
    { href: '/dashboard', label: 'Журнал', icon: BookOpen },
    { href: '/dashboard/schedule', label: 'Расписание', icon: Calendar },
    { href: '/dashboard/classes', label: 'Мои классы', icon: Users },
    { href: '/dashboard/attendance', label: 'Посещаемость', icon: BarChart },
    { href: '/dashboard/messages', label: 'Сообщения', icon: MessageSquare },
    { href: '/dashboard/settings', label: 'Настройки', icon: Settings },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { toggleSidebar, isMobile } = useSidebar();

    return (
        <Sidebar>
            <SidebarHeader className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                    <Logo className="h-8 w-8 text-primary" />
                    <span className="font-headline text-lg group-data-[collapsible=icon]:hidden">GradeBook Pro</span>
                </div>
                {isMobile && (
                    <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                        <PanelLeft />
                    </Button>
                )}
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {menuItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href}
                                tooltip={item.label}
                            >
                                <a href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <form action={logout} className="w-full">
                    <SidebarMenuButton tooltip="Выйти" asChild>
                         <button type="submit" className="w-full">
                            <LogOut />
                            <span>Выйти</span>
                        </button>
                    </SidebarMenuButton>
                </form>
            </SidebarFooter>
        </Sidebar>
    );
}
