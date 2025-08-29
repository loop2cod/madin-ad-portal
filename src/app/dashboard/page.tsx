'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { get } from '@/utilities/AxiosInterceptor';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Building,
  UserCheck
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DashboardStats {
  userStats: Array<{ _id: string; count: number }>;
  admissionStats: Array<{ _id: string; count: number }>;
  departmentStats: Array<{ _id: string; count: number }>;
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    createdAt: string;
  }>;
  recentAdmissions: Array<{
    _id: string;
    applicationId: string;
    personalDetails: {
      fullName: string;
      firstName?: string;
      lastName?: string;
      email: string;
    };
    programSelections: Array<{
      programLevel: string;
      programName: string;
      mode?: string;
      specialization?: string;
      branchPreferences?: Array<{
        branch: string;
        priority: number;
      }>;
      selected: boolean;
      priority: number;
    }>;
    status: string;
    department?: string;
    createdAt: string;
  }>;
}

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await get<{
        success: boolean;
        data: DashboardStats;
      }>('/api/v1/admin/dashboard/stats');
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'under_review':
        return <Clock className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Department Staff Dashboard - Show only department-specific content
  if (user?.role === 'department_staff') {
    return (
      <ProtectedRoute requiredPermissions={['view_department_applications']}>
        <DashboardLayout title="Department Dashboard">
          <div className="bg-gray-50 min-h-full">
            <div className="mx-auto p-6">
              {/* Department Staff Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Department Dashboard</h1>
                <p className="text-gray-600 mt-2">
                  Welcome back, {user?.name}!.
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <Badge variant="secondary">
                    <Building className="w-3 h-3 mr-1" />
                    {user.department}
                  </Badge>
                  <Badge variant="outline">
                    {getRoleDisplayName(user?.role || '')}
                  </Badge>
                </div>
              </div>

              {/* Department Stats - Only show department-specific data */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Department Applications</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.departmentStats?.find(d => d._id === user.department)?.count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total applications
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.admissionStats?.find(s => s._id === 'pending')?.count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Applications pending
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.admissionStats?.find(s => s._id === 'approved')?.count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Applications approved
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Department Applications */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Applications</CardTitle>
                  <CardDescription>
                    Latest applications for {user.department}
                  </CardDescription>
                </CardHeader>
                <CardContent>
     <ScrollArea className="h-72  rounded-md border">
                  <div className="space-y-2">
                    {(() => {
                      const departmentApplications = stats?.recentAdmissions?.filter(admission => admission.department === user.department).slice(0, 5);

                      if (!departmentApplications || departmentApplications.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">No recent applications</p>
                            <p className="text-xs text-gray-400 mt-1">Applications for {user.department} will appear here once submitted</p>
                          </div>
                        );
                      }

                      return departmentApplications.map((admission) => {
                        const selectedProgram = admission.programSelections?.find(p => p.selected);
                        const createdDate = new Date(admission.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });

                        return (
                          <div
                            key={admission._id}
                            className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {admission.personalDetails.fullName ||
                                   `${admission.personalDetails.firstName} ${admission.personalDetails.lastName}`}
                                </p>
                                <p className="text-xs text-gray-600 font-medium">
                                  ID: {admission.applicationId}
                                </p>
                              </div>
                              <Badge
                                variant="secondary"
                                className={getStatusColor(admission.status)}
                              >
                                {getStatusIcon(admission.status)}
                                <span className="ml-1 capitalize">{admission.status}</span>
                              </Badge>
                            </div>

                            <p className="text-xs text-gray-500 mb-3">
                              Created: {createdDate}
                            </p>

                            {selectedProgram && (
                              <div className="bg-gray-50 p-1 rounded-md">
                                <p className="text-xs font-medium text-gray-700 mb-1">Program Details:</p>
                                <p className="text-xs text-gray-900 font-medium">{selectedProgram.programName}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    Level: {selectedProgram.programLevel.toUpperCase()}
                                  </Badge>
                                  {selectedProgram.mode && (
                                    <Badge variant="outline" className="text-xs">
                                      Mode: {selectedProgram.mode}
                                    </Badge>
                                  )}
                                  {selectedProgram.specialization && (
                                    <Badge variant="outline" className="text-xs">
                                      Specialization: {selectedProgram.specialization}
                                    </Badge>
                                  )}
                                </div>
                                {selectedProgram.branchPreferences && selectedProgram.branchPreferences.length > 0 && (
                                  <p className="text-xs text-gray-600 mt-2">
                                    Branch: {selectedProgram.branchPreferences
                                      .sort((a, b) => a.priority - b.priority)
                                      .map(b => b.branch)
                                      .join(', ')}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Admin Dashboard - For Super Admin and Admission Officer only
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'admission_officer']}>
      <DashboardLayout title="Admin Dashboard">
        <div className="bg-gray-50 min-h-full">
          <div className="mx-auto p-6">
            {/* Admin Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user?.name}!
              </p>
              <div className="mt-4 flex items-center gap-4">
                <Badge variant="outline">
                  {getRoleDisplayName(user?.role || '')}
                </Badge>
                {user?.department && (
                  <Badge variant="outline">
                    <Building className="w-3 h-3 mr-1" />
                    {user.department}
                  </Badge>
                )}
              </div>
            </div>

          {/* Admin Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* User Statistics - Only visible to Super Admin */}
            {user?.role === 'super_admin' && stats?.userStats && (
              <>
                {stats.userStats.map((stat) => (
                  <Card key={stat._id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {getRoleDisplayName(stat._id)}
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.count}</div>
                      <p className="text-xs text-muted-foreground">
                        Active users
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {/* Admission Statistics - Visible to both Super Admin and Admission Officer */}
            {stats?.admissionStats && (
              <>
                {stats.admissionStats.map((stat) => (
                  <Card key={stat._id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat._id?.charAt(0).toUpperCase() + stat._id?.slice(1) || 'Applications'}
                      </CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.count}</div>
                      <p className="text-xs text-muted-foreground">
                        Applications
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Applications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>
                  Latest admission applications
                </CardDescription>
              </CardHeader>
                <CardContent>
                  <ScrollArea className="h-72  rounded-md border">
                  <div className="space-y-2">
                    {stats?.recentAdmissions && stats.recentAdmissions.length > 0 ? (
                      stats.recentAdmissions.map((admission) => {
                        const selectedProgram = admission.programSelections?.find(p => p.selected);
                        const createdDate = new Date(admission.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });

                        return (
                          <div
                            key={admission._id}
                            className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {admission.personalDetails?.fullName}
                                </p>
                                <p className="text-xs text-gray-600 font-medium">
                                  ID: {admission.applicationId}
                                </p>
                              </div>
                              <Badge
                                variant="secondary"
                                className={getStatusColor(admission.status)}
                              >
                                {getStatusIcon(admission.status)}
                                <span className="ml-1 capitalize">{admission.status}</span>
                              </Badge>
                            </div>

                            <p className="text-xs text-gray-500 mb-3">
                              Created: {createdDate}
                            </p>

                            {selectedProgram && (
                              <div className="bg-gray-50 p-1 rounded-md">
                                <p className="text-xs font-medium text-gray-700 mb-1">Program Details:</p>
                                <p className="text-xs text-gray-900 font-medium">{selectedProgram.programName}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    Level: {selectedProgram.programLevel.toUpperCase()}
                                  </Badge>
                                  {selectedProgram.mode && (
                                    <Badge variant="outline" className="text-xs">
                                      Mode: {selectedProgram.mode}
                                    </Badge>
                                  )}
                                  {selectedProgram.specialization && (
                                    <Badge variant="outline" className="text-xs">
                                      Specialization: {selectedProgram.specialization}
                                    </Badge>
                                  )}
                                </div>
                                {selectedProgram.branchPreferences && selectedProgram.branchPreferences.length > 0 && (
                                  <p className="text-xs text-gray-600 mt-2">
                                    Branch: {selectedProgram.branchPreferences
                                      .sort((a, b) => a.priority - b.priority)
                                      .map(b => b.branch)
                                      .join(', ')}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No recent applications</p>
                        <p className="text-xs text-gray-400 mt-1">Applications will appear here once submitted</p>
                      </div>
                    )}
                  </div>
                  </ScrollArea>
                </CardContent>
              </Card>

            {/* Recent Users - Only visible to Super Admin */}
            {user?.role === 'super_admin' && stats?.recentUsers && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                  <CardDescription>
                    Newly added users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto space-y-4">
                    {stats.recentUsers.map((recentUser,index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{recentUser.name}</h4>
                          <p className="text-xs text-gray-500">
                            {recentUser.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            <UserCheck className="w-3 h-3 mr-1" />
                            {getRoleDisplayName(recentUser.role)}
                          </Badge>
                          {recentUser.department && (
                            <Badge variant="secondary" className="text-xs">
                              {recentUser.department}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Department Statistics - Visible to both Super Admin and Admission Officer */}
          {(user?.role === 'super_admin' || user?.role === 'admission_officer') && stats?.departmentStats && stats.departmentStats.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Department-wise Applications</CardTitle>
                <CardDescription>
                  Application distribution across departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.departmentStats.map((dept) => (
                    <div
                      key={dept._id}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <h4 className="font-medium text-sm">{dept._id}</h4>
                      <p className="text-2xl font-bold text-blue-900">{dept.count}</p>
                      <p className="text-xs text-gray-500">Applications</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}