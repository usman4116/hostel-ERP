import { Bell, Menu, Search, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

export function AdminTopbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm border-b border-border/40 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
        <div className="relative hidden sm:block w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search anything..."
            className="w-full pl-9 bg-muted/50 border-none rounded-full focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground rounded-full">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted outline-none transition-colors">
            <Avatar className="h-9 w-9 border-2 border-primary/20">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.first_name || 'Admin'}`} alt="@admin" />
              <AvatarFallback><UserIcon className="w-4 h-4" /></AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500 focus:bg-red-50">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
