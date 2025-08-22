'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { get, post, patch } from '@/utilities/AxiosInterceptor';
import {
  GraduationCap,
  Search,
  Building,
  IdCard,
  Calendar,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Download,
  Filter,
  UserPlus,
  RotateCcw,
  Eye,
  EyeOff,
  Plus
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StudentLogin {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'student';
  department: string;
  admissionNumber: string;
  applicationId: string;
  isActive: boolean;
  isFirstLogin: boolean;
  lastLogin?: string;
  createdAt: string;
  admissionData: {
    fullName: string;
    applicationId: string;
    status: string;
    applicationCreatedAt: string;
  };
}

interface StudentLoginsResponse {
  success: boolean;
  data: {
    students: StudentLogin[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export default function StudentLoginsPage() {
  const router = useRouter();
  const { user: currentUser, hasPermission } = useAuth();
  const [students, setStudents] = useState<StudentLogin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentLogin | null>(null);
  
  // Create login states
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [admissionCheck, setAdmissionCheck] = useState<{loading: boolean, result: any}>({loading: false, result: null});
  
  // Reset password states
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  
  const { toast } = useToast();

  const departments = [
    'Civil Engineering',
    'Mechanical Engineering',
    'Electrical and Electronics Engineering',
    'Computer Engineering',
    'Automobile Engineering',
    'Architecture',
    'MBA'
  ];

  useEffect(() => {
    fetchStudentLogins();
  }, [page, searchTerm, departmentFilter]);

  const fetchStudentLogins = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(departmentFilter && departmentFilter !== 'all' && { department: departmentFilter })
      });

      const response = await get<StudentLoginsResponse>(`/api/v1/admin/students/logins?${params}`);

      if (response.success) {
        setStudents(response.data.students);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch student logins:', error);
      toast({
        title: "Error",
        description: "Failed to fetch student logins",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // This would be implemented to export student data
      toast({
        title: "Export",
        description: "Export functionality would be implemented here",
      });
    } catch (error) {
      console.error('Failed to export student logins:', error);
      toast({
        title: "Error",
        description: "Failed to export student logins",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'under_review':
        return 'outline';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const checkAdmissionNumber = async (admissionNum: string) => {
    if (!admissionNum.trim()) {
      setAdmissionCheck({loading: false, result: null});
      return;
    }

    try {
      setAdmissionCheck({loading: true, result: null});
      
      // Check if admission number exists and if login already exists
      const response:any = await get(`/api/v1/admin/students/check-admission/${admissionNum.trim()}`);
      
      setAdmissionCheck({loading: false, result: response.data});
    } catch (error: any) {
      console.error('Failed to check admission number:', error);
      setAdmissionCheck({loading: false, result: null});
      toast({
        title: "Error",
        description: "Failed to check admission number",
        variant: "destructive",
      });
    }
  };

  const handleCreateLogin = async () => {
    if (!admissionNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter an admission number",
        variant: "destructive",
      });
      return;
    }

    try {
      const response:any = await post('/api/v1/admin/students/create-login', {
        admissionNumber: admissionNumber.trim()
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `Student login created successfully. Default password: ${response.data.defaultPassword}`,
        });
        
        // Reset form and refresh data
        setAdmissionNumber('');
        setAdmissionCheck({loading: false, result: null});
        setCreateDialogOpen(false);
        fetchStudentLogins();
      }
    } catch (error: any) {
      console.error('Failed to create student login:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create student login",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedStudent || !newPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive",
      });
      return;
    }

    try {
      setResetLoading(true);
      
      const response:any = await patch(`/api/v1/admin/students/${selectedStudent._id}/reset-password`, {
        newPassword: newPassword.trim()
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Password reset successfully",
        });
        
        // Reset form
        setNewPassword('');
        setShowPassword(false);
        setResetDialogOpen(false);
        setSelectedStudent(null);
      }
    } catch (error: any) {
      console.error('Failed to reset password:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  if (loading) {
    return (
      <ProtectedRoute requiredPermissions={['view_all_users']}>
        <DashboardLayout title="Student Logins">
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={['view_all_users']}>
      <DashboardLayout title="Student Logins">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Logins</h1>
              <p className="text-gray-600 mt-2">View and manage students with created login accounts</p>
            </div>

            <div className="flex items-center gap-2">
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Login
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Button onClick={handleExport} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export List
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, admission number, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setDepartmentFilter('all');
                setPage(1);
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>

          {/* Students List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Student Logins ({pagination?.total || 0})
              </CardTitle>
              <CardDescription>
                Students with automatically created login accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No student logins found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Details</TableHead>
                        <TableHead>Admission Info</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Login Info</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student._id}>
                          <TableCell>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {student.admissionData.fullName || student.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {student.department}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                <IdCard className="w-3 h-3" />
                                {student.admissionNumber}
                              </div>
                              <div className="text-sm text-gray-600">
                                App: {student.admissionData.applicationId || student.applicationId}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {student.email}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {student.mobile}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant={student.isActive ? "default" : "destructive"}
                                className="text-xs w-fit"
                              >
                                {student.isActive ? (
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
                              {student.admissionData.status && (
                                <Badge 
                                  variant={getStatusColor(student.admissionData.status)} 
                                  className="text-xs w-fit"
                                >
                                  {student.admissionData.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Created: {new Date(student.createdAt).toLocaleDateString()}</div>
                              {student.isFirstLogin && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  First Login Pending
                                </Badge>
                              )}
                              {student.lastLogin && (
                                <div className="text-gray-500 mt-1">
                                  Last: {new Date(student.lastLogin).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/students/${student._id}`)}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setResetDialogOpen(true);
                                }}
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Reset Password
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} students
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

      {/* Create Login Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Student Login</DialogTitle>
            <DialogDescription>
              Enter an admission number to check availability and create a student login account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Admission Number</label>
              <Input
                placeholder="Enter admission number (e.g., MAD/2025-26/1234)"
                value={admissionNumber}
                onChange={(e) => {
                  setAdmissionNumber(e.target.value);
                  if (e.target.value.trim()) {
                    checkAdmissionNumber(e.target.value);
                  } else {
                    setAdmissionCheck({loading: false, result: null});
                  }
                }}
              />
            </div>

            {/* Admission Number Check Result */}
            {admissionCheck.loading && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                Checking admission number...
              </div>
            )}

            {admissionCheck.result && (
              <div className="space-y-2">
                {admissionCheck.result.admissionExists ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <UserCheck className="w-4 h-4" />
                    Admission number exists - {admissionCheck.result.studentName}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <UserX className="w-4 h-4" />
                    Admission number not found in system
                  </div>
                )}

                {admissionCheck.result.loginExists ? (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <UserCheck className="w-4 h-4" />
                    Login account already exists
                  </div>
                ) : (
                  admissionCheck.result.admissionExists && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Plus className="w-4 h-4" />
                      Ready to create login account
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setAdmissionNumber('');
                setAdmissionCheck({loading: false, result: null});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateLogin}
              disabled={!admissionCheck.result?.admissionExists || admissionCheck.result?.loginExists || !admissionNumber.trim()}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {selectedStudent?.admissionData.fullName || selectedStudent?.name}
              ({selectedStudent?.admissionNumber})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateRandomPassword}
              className="w-full"
            >
              Generate Random Password
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetDialogOpen(false);
                setSelectedStudent(null);
                setNewPassword('');
                setShowPassword(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={!newPassword.trim() || resetLoading}
            >
              {resetLoading ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}