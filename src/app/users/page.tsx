'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { get, patch, del } from '@/utilities/AxiosInterceptor';
import { User, UserRole } from '@/types/auth';
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Building,
  UserCheck,
  UserX
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UsersResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export default function UsersPage() {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await get<UsersResponse>(`/api/v1/admin/users?page=${page}&limit=10&search=${searchTerm}`);

      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await patch(`/api/v1/admin/users/${userId}/toggle-status`);

      // Update local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, isActive: !currentStatus } : user
      ));

      toast({
        title: "Success",
        description: `User ${currentStatus ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (error:any) {
      console.error('Failed to toggle user status:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message ||"Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await del(`/api/v1/admin/users/${userToDelete}`);

      // Remove from local state
      setUsers(users.filter(user => user.id !== userToDelete));

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error:any) {
      console.error('Failed to delete user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message ||"Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const getRoleDisplayName = (role:any) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admission_officer':
        return 'Admission Officer';
      case 'department_staff':
        return 'Department Staff';
      case 'student':
        return 'Student';
      default:
        return role;
    }
  };

  const getRoleIcon = (role: any) => {
    switch (role) {
      case 'super_admin':
        return <Shield className="w-3 h-3" />;
      case 'admission_officer':
        return <UserCheck className="w-3 h-3" />;
      case 'department_staff':
        return <Building className="w-3 h-3" />;
      case 'student':
        return <Users className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  const canManageUser = (targetUser: User) => {
    if (currentUser?.role === 'super_admin') return true;
    if (currentUser?.role === 'admission_officer') {
      return targetUser.role === 'department_staff';
    }
    return false;
  };

  if (loading) {
    return (
      <ProtectedRoute requiredPermissions={['view_all_users']}>
        <DashboardLayout title="User Management">
             <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full"></div>
      </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={['view_all_users']}>
      <DashboardLayout title="User Management">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-2">Manage administrative users and their roles</p>
            </div>

            {hasPermission('create_department_staff') && (
              <Link href="/users/create">
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </Link>
            )}
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users ({pagination?.total || 0})
              </CardTitle>
              <CardDescription>
                Administrative users in the system (students are managed separately)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No users found</p>
                </div>
              ) : (
                <ScrollArea className="h-[62vh]">
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{user.name}</h4>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <div className="flex items-center gap-2 mt-2">
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
                              <Badge
                                variant={user.isActive ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {user.isActive ? (
                                  <>
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <UserX className="w-3 h-3 mr-1" />
                                    Inactive
                                  </>
                                )}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">
                            Created: {new Date(user.createdAt).toLocaleDateString()}
                          </p>

                          {canManageUser(user) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                {hasPermission('edit_users') && (
                                  <Link href={`/users/${user.id}/edit`}>
                                    <DropdownMenuItem>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit User
                                    </DropdownMenuItem>
                                  </Link>
                                )}

                                {hasPermission('activate_deactivate_users') && (
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(user.id, user.isActive)}
                                  >
                                    {user.isActive ? (
                                      <>
                                        <UserX className="w-4 h-4 mr-2" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="w-4 h-4 mr-2" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}

                                {hasPermission('delete_users') && (
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} users
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}