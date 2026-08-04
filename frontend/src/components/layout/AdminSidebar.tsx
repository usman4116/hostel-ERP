import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building,
  CreditCard,
  MessageSquare,
  Calendar,
  LogOut,
  FileSignature
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Students", href: "/admin/students", icon: Users },
  { title: "Student Documents", href: "/admin/documents", icon: MessageSquare },
  { title: "Hostel Rooms", href: "/admin/rooms", icon: Building },
  { title: "Room Inspections", href: "/admin/inspections", icon: Building },
  { title: "Contracts", href: "/admin/contracts", icon: FileSignature },
  { title: "Leave Notices", href: "/admin/leave-notices", icon: FileSignature },
  { title: "Vouchers", href: "/admin/vouchers", icon: CreditCard },
  { title: "Rent Payment History", href: "/admin/rent-history", icon: CreditCard },
  { title: "Security Deposits", href: "/admin/deposits", icon: CreditCard },
  { title: "Complaints", href: "/admin/complaints", icon: MessageSquare },
  { title: "Visitors", href: "/admin/visitors", icon: Users },
  { title: "Contacts", href: "/admin/contacts", icon: MessageSquare },
  { title: "Calendar Events", href: "/admin/calendar", icon: Calendar },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-full shadow-sm hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-border/40 gap-3">
        <Image src="/logo.png" alt="OpenERP Logo" width={32} height={32} className="rounded-sm" />
        <h1 className="font-bold text-2xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          OpenERP
        </h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          // Special case for dashboard to not highlight on all subroutes
          const isExactDashboard = item.href === "/admin" && pathname !== "/admin";
          const highlight = isActive && !isExactDashboard;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative",
                highlight
                  ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 mr-3", highlight ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
              {item.title}
              {highlight && (
                <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white opacity-80" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/40">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-red-500 rounded-xl hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground font-medium">Developed by Usman Farhan</p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">© 2026 OpenERP. All rights reserved.</p>
        </div>
      </div>
    </aside>
  );
}
