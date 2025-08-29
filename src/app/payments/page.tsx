'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EnhancedStudentPaymentManagement } from '@/components/EnhancedStudentPaymentManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { get } from '@/utilities/AxiosInterceptor';
import { useToast } from '@/components/ui/use-toast';
import { 
  CreditCard, 
  Search, 
  Filter,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  RefreshCw
} from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  email: string;
  admissionNumber: string;
  department: string;
}

interface PaymentAnalytics {
  overview: {
    totalPayments: number;
    totalAmountCollected: number;
    totalConvenienceFee: number;
    onlinePayments: number;
    offlinePayments: number;
    completedPayments: number;
    pendingPayments: number;
    failedPayments: number;
  };
  monthlyBreakdown: Array<{
    _id: { year: number; month: number };
    totalAmount: number;
    totalPayments: number;
    completedPayments: number;
  }>;
}

export default function PaymentManagementPage() {
  const { hasPermission } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [analyticsFilters, setAnalyticsFilters] = useState({
    academicYear: '',
    paymentMethod: '',
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchStudents = async () => {
    try {
      const response = await get<any>('/api/v1/admin/students');
      if (response.success) {
        setStudents(response.data.students || response.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch students',
        variant: 'destructive',
      });
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(analyticsFilters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await get<any>(
        `/api/v1/student-payments/analytics?${queryParams}`
      );
      
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payment analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  };

  useEffect(() => {
    fetchStudents();
    fetchAnalytics();
  }, []);

  // Loading state
  if (loading) {
    return (
      <ProtectedRoute requiredPermissions={['view_all_users']}>
        <DashboardLayout title="Payment Management">
          <div className="flex justify-center items-center min-h-96">
            <div className="animate-spin w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={['view_all_users']}>
      <DashboardLayout title="Payment Management">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
              <p className="text-gray-600 mt-2">
                Manage student fee payments, track transactions, and view analytics
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  fetchStudents();
                  fetchAnalytics();
                }}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <Tabs defaultValue="student-payments" className="space-y-6">
            <TabsList>
              <TabsTrigger value="student-payments">Student Payments</TabsTrigger>
              <TabsTrigger value="analytics">Payment Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="student-payments" className="space-y-6">
              {!selectedStudent ? (
                <>
                  {/* Search and Filter Section */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search students by name, admission number, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button onClick={fetchStudents} variant="outline" className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Refresh Students
                    </Button>
                  </div>

                  {/* Student List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Students ({students.length})
                      </CardTitle>
                      <CardDescription>
                        Select a student to manage their fee payments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {students
                          .filter(student => 
                            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            student.email.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map(student => (
                            <div 
                              key={student._id}
                              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => setSelectedStudent(student)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="font-medium">{student.name}</h3>
                                  <p className="text-sm text-gray-600">{student.email}</p>
                                  <p className="text-sm text-gray-600">{student.admissionNumber}</p>
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline">{student.department}</Badge>
                                  <div className="mt-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setSelectedStudent(student)}
                                      className="flex items-center gap-1"
                                    >
                                      <CreditCard className="w-3 h-3" />
                                      Manage Payments
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">{selectedStudent.name}</CardTitle>
                          <CardDescription>
                            {selectedStudent.admissionNumber} • {selectedStudent.department}
                          </CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => setSelectedStudent(null)}
                        >
                          Back to Student List
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                  
                  <EnhancedStudentPaymentManagement 
                    studentId={selectedStudent._id}
                    canManagePayments={hasPermission('view_all_users')}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Analytics Filters
                  </CardTitle>
                  <CardDescription>
                    Filter payment analytics by date range, academic year, and payment method
                  </CardDescription>
                </CardHeader>
                <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Select
                    value={analyticsFilters.academicYear}
                    onValueChange={(value) => setAnalyticsFilters(prev => ({ ...prev, academicYear: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="2024-25">2024-25</SelectItem>
                      <SelectItem value="2023-24">2023-24</SelectItem>
                      <SelectItem value="2022-23">2022-23</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={analyticsFilters.paymentMethod}
                    onValueChange={(value) => setAnalyticsFilters(prev => ({ ...prev, paymentMethod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="razorpay_online">Online</SelectItem>
                      <SelectItem value="cash_office">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={analyticsFilters.startDate}
                    onChange={(e) => setAnalyticsFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={analyticsFilters.endDate}
                    onChange={(e) => setAnalyticsFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Button onClick={fetchAnalytics} disabled={loading}>
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Update Analytics
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Overview */}
          {analytics && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Collected</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(analytics.overview.totalAmountCollected)}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Payments</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {analytics.overview.totalPayments}
                        </p>
                      </div>
                      <CreditCard className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Online Payments</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {analytics.overview.onlinePayments}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Convenience Fee</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatCurrency(analytics.overview.totalConvenienceFee)}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {analytics.overview.completedPayments}
                      </p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">
                        {analytics.overview.pendingPayments}
                      </p>
                      <p className="text-sm text-gray-600">Pending</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {analytics.overview.failedPayments}
                      </p>
                      <p className="text-sm text-gray-600">Failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Payment Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.monthlyBreakdown.map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">
                            {getMonthName(month._id.month)} {month._id.year}
                          </p>
                          <p className="text-sm text-gray-600">
                            {month.totalPayments} payments ({month.completedPayments} completed)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(month.totalAmount)}</p>
                          <p className="text-sm text-gray-600">
                            {Math.round((month.completedPayments / month.totalPayments) * 100)}% success rate
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              </>
            )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}