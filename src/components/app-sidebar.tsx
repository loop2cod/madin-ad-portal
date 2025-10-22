"use client"

import * as React from "react"
import {
  GalleryVerticalEnd,
  Users,
  FileText,
  Settings,
  BarChart3,
  UserPlus,
  Shield,
  Building,
  LogOut,
  User,
  MessageCircle,
  GraduationCap,
  DollarSign,
  Award,
  CreditCard
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Role-based navigation items
const getNavigationItems = (user: any) => {
  const items = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: GalleryVerticalEnd,
      permission: "view_admin_dashboard"
    }
  ];

  // Super Admin items
  if (user?.role === 'super_admin') {
    items.push(
      {
        title: "User Management",
        url: "/users",
        icon: Users,
        permission: "view_all_users"
      },
      {
        title: "Student Logins",
        url: "/students",
        icon: GraduationCap,
        permission: "view_all_users"
      },
      {
        title: "All Applications",
        url: "/applications",
        icon: FileText,
        permission: "view_all_applications"
      },
      {
        title: "Student Requests",
        url: "/certificates",
        icon: Award,
        permission: "view_all_applications"
      },
      {
        title: "Quick Admission",
        url: "/quick-admission",
        icon: UserPlus,
        permission: "view_all_applications"
      },
      {
        title: "WhatsApp Portal",
        url: "/whatsapp",
        icon: MessageCircle,
        permission: "view_all_applications"
      },
      {
        title: "Analytics",
        url: "/analytics",
        icon: BarChart3,
        permission: "view_analytics"
      },
      {
        title: "Fee Structures",
        url: "/fee-structures",
        icon: DollarSign,
        permission: "manage_settings"
      },
      {
        title: "Payment Management",
        url: "/payments",
        icon: CreditCard,
        permission: "manage_payments"
      },
      {
        title: "System Settings",
        url: "/settings",
        icon: Settings,
        permission: "manage_settings"
      }
    );
  }

  // Admission Officer items
  if (user?.role === 'admission_officer') {
    items.push(
      {
        title: "Manage Users",
        url: "/users",
        icon: Users,
        permission: "view_all_users"
      },
      {
        title: "Student Logins",
        url: "/students",
        icon: GraduationCap,
        permission: "view_all_users"
      },
      {
        title: "All Applications",
        url: "/applications",
        icon: FileText,
        permission: "view_all_applications"
      },
      {
        title: "Student Requests",
        url: "/certificates",
        icon: Award,
        permission: "view_all_applications"
      },
      {
        title: "Quick Admission",
        url: "/quick-admission",
        icon: UserPlus,
        permission: "view_all_applications"
      },
      {
        title: "WhatsApp Portal",
        url: "/whatsapp",
        icon: MessageCircle,
        permission: "view_all_applications"
      },
      {
        title: "Analytics",
        url: "/analytics",
        icon: BarChart3,
        permission: "view_analytics"
      },
      {
        title: "Fee Structures",
        url: "/fee-structures",
        icon: DollarSign,
        permission: "manage_settings"
      },
      {
        title: "Add Staff",
        url: "/users/create",
        icon: UserPlus,
        permission: "create_department_staff"
      }
    );
  }

  // Department Staff items
  if (user?.role === 'department_staff') {
    items.push(
      {
        title: "My Applications",
        url: "/applications/department",
        icon: FileText,
        permission: "view_department_applications"
      },
      {
        title: "Student Requests",
        url: "/certificates",
        icon: Award,
        permission: "view_department_applications"
      },
      {
        title: "Department",
        url: "/department",
        icon: Building,
        permission: "view_department_applications"
      }
    );
  }

  return items;
};

const getRoleDisplayName = (role: string) => {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'admission_officer':
      return 'Admission Officer';
    case 'department_staff':
      return 'Department Staff';
    default:
      return role;
  }
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'super_admin':
      return <Shield className="w-3 h-3" />;
    case 'admission_officer':
      return <UserPlus className="w-3 h-3" />;
    case 'department_staff':
      return <Building className="w-3 h-3" />;
    default:
      return <User className="w-3 h-3" />;
  }
};


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout, hasPermission } = useAuth();
  
  // Get navigation items based on user role
  const navigationItems = getNavigationItems(user);
  
  // Filter items based on permissions
  const filteredItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission as any)
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div
          className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-primary-foreground-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-primary-foreground-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-primary-foreground-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-primary-foreground-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-6 items-center justify-center rounded-xl bg-primary text-primary-foreground mx-auto">
            <GalleryVerticalEnd className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">
              MADIN
            </span>
            <span className="truncate text-xs">College of Engineering & Management</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <NavMain items={filteredItems} />
      </SidebarContent>
      
      <SidebarFooter>
        {user && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="text-xs">
                {getRoleIcon(user.role)}
                <span className="ml-1">{getRoleDisplayName(user.role)}</span>
              </Badge>
              {user.department && (
                <Badge variant="outline" className="text-xs">
                  <Building className="w-3 h-3 mr-1" />
                  {user.department}
                </Badge>
              )}
            </div>
            
            <Button 
              onClick={logout}
              variant="ghost" 
              size="sm" 
              className="w-full justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
