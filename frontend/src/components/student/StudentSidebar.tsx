'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Receipt, User, Settings, LogOut, FileSignature } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { title: "Dashboard", href: "/student", icon: Home },
  { title: "My Vouchers", href: "/student/vouchers", icon: Receipt },
  { title: "My Contract", href: "/student/contract", icon: FileSignature },
  { title: "My Profile", href: "/student/profile", icon: User },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-full flex flex-col text-sidebar-foreground transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border gap-3">
        <Image src="/logo.png" alt="OpenERP Logo" width={32} height={32} className="rounded-sm" />
        <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          OpenERP
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-1.5">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <span
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href || (item.href !== '/student' && pathname.startsWith(item.href))
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.title}
              </span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border space-y-1.5">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium w-full text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium w-full text-red-500/80 hover:bg-red-500/10 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
        <div className="mt-4 text-center">
          <p className="text-xs text-sidebar-foreground/70 font-medium">Developed by Usman Farhan</p>
          <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">© 2026 OpenERP. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
