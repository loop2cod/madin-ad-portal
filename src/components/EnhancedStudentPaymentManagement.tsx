'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { get, post } from '@/utilities/AxiosInterceptor';
import { useToast } from '@/components/ui/use-toast';
import { 
  CreditCard, 
  Plus, 
  Receipt, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Download,
  ArrowRight,
  Calendar,
  User,
  TrendingUp,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

interface Student {
  _id: string;
  name: string;
  email: string;
  admissionNumber: string;
  department: string;
}

interface FeeBreakdown {
  feeType: string;
  amount: number;
}

interface Payment {
  _id: string;
  student: Student;
  paymentType: string;
  semester: number;
  totalAmountDue: number;
  amountPaid: number;
  convenienceFee: number;
  totalAmountCharged: number;
  remainingBalance: number;
  paymentMethod: string;
  paymentSource: string;
  paymentStatus: string;
  paymentDate: string;
  academicYear: string;
  notes?: string;
  razorpayDetails?: {
    orderId?: string;
    paymentId?: string;
    receipt?: string;
  };
  manualPaymentDetails?: {
    receiptNumber?: string;
    transactionId?: string;
    ddNumber?: string;
    chequeNumber?: string;
    bankName?: string;
    branchName?: string;
    depositDate?: string;
  };
  feeBreakdown: FeeBreakdown[];
  processedBy?: {
    name: string;
    email: string;
  };
  verifiedBy?: {
    name: string;
    email: string;
  };
}

interface SemesterDue {
  semester: number;
  semesterName: string;
  totalDue: number;
  totalPaid: number;
  outstanding: number;
  paymentStatus: 'fully_paid' | 'partially_paid' | 'unpaid';
  feeBreakdown: {
    admissionFee: number;
    examPermitRegFee: number;
    specialFee: number;
    tuitionFee: number;
    feeFundCharges?: number;
    others: number;
  };
}

interface FeeAssignment {
  _id: string;
  feeStructureSnapshot: {
    academicYear: string;
    semesters: Array<{
      semester: number;
      semesterName: string;
      fees: {
        admissionFee: number;
        examPermitRegFee: number;
        specialFee: number;
        tuitionFee: number;
        feeFundCharges?: number;
        others: number;
      };
      total: number;
    }>;
    grandTotal: number;
    hostelFee: number;
  };
  customizations?: Array<{
    semester: number;
    fees: {
      admissionFee?: number;
      examPermitRegFee?: number;
      specialFee?: number;
      tuitionFee?: number;
      feeFundCharges?: number;
      others?: number;
    };
    reason?: string;
    customizedBy: {
      name: string;
      email: string;
    };
    customizedAt: string;
  }>;
}

interface PaymentSummary {
  totalAmountDue: number;
  totalAmountPaid: number;
  totalConvenienceFee: number;
  totalOutstanding: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
}

interface EnhancedStudentPaymentManagementProps {
  studentId: string;
  canManagePayments: boolean;
}

export const EnhancedStudentPaymentManagement: React.FC<EnhancedStudentPaymentManagementProps> = ({
  studentId,
  canManagePayments
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [feeAssignment, setFeeAssignment] = useState<FeeAssignment | null>(null);
  const [semesterDues, setSemesterDues] = useState<SemesterDue[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPendingDues, setShowPendingDues] = useState(true);
  
  const [filters, setFilters] = useState({
    academicYear: '',
    paymentStatus: '',
    semester: ''
  });

  const [formData, setFormData] = useState({
    paymentType: 'semester_payment',
    semester: '',
    amountPaid: '',
    paymentMethod: 'cash_office',
    receiptNumber: '',
    ddNumber: '',
    chequeNumber: '',
    bankName: '',
    branchName: '',
    depositDate: '',
    notes: '',
    feeBreakdown: [] as FeeBreakdown[]
  });

  const { toast } = useToast();

  useEffect(() => {
    if (studentId) {
      fetchStudentDetails();
      fetchPaymentHistory();
      fetchPaymentSummary();
    }
  }, [studentId]);

  useEffect(() => {
    if (feeAssignment && payments.length >= 0) {
      calculateSemesterDues();
    }
  }, [feeAssignment, payments]);

  const fetchStudentDetails = async () => {
    try {
      const response = await get<any>(`/api/v1/admin/students/${studentId}/details`);
      if (response.success) {
        // The response contains student login data
        const studentData = {
          _id: response.data.studentLogin._id,
          name: response.data.studentLogin.name,
          email: response.data.studentLogin.email,
          admissionNumber: response.data.studentLogin.admissionNumber,
          department: response.data.studentLogin.department || 'N/A'
        };
        setSelectedStudent(studentData);
        
        // If fee assignment exists in the response, use it
        if (response.data.feeAssignment) {
          setFeeAssignment(response.data.feeAssignment);
        } else {
          // Try to fetch fee assignment separately if needed
          console.log('No fee assignment found for student');
        }
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
    }
  };


  const fetchPaymentHistory = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.academicYear) queryParams.append('academicYear', filters.academicYear);
      if (filters.paymentStatus) queryParams.append('paymentStatus', filters.paymentStatus);
      if (filters.semester) queryParams.append('semester', filters.semester);

      const response = await get<any>(
        `/api/v1/student-payments/student/${studentId}/history?${queryParams}`
      );
      
      if (response.success) {
        const paymentsData = response.data.payments || [];
        console.log('Fetched payments data:', paymentsData);
        setPayments(paymentsData);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payment history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentSummary = async () => {
    try {
      const response = await get<any>(`/api/v1/student-payments/student/${studentId}/summary`);
      if (response.success) {
        setPaymentSummary(response.data);
      }
    } catch (error) {
      console.error('Error fetching payment summary:', error);
    }
  };

  const calculateSemesterDues = () => {
    if (!feeAssignment) return;

    const dues = feeAssignment.feeStructureSnapshot.semesters.map(semester => {
      // Check for customizations for this semester
      const customization = feeAssignment.customizations?.find(
        custom => custom.semester === semester.semester
      );
      
      // Calculate the final fees (original + customizations)
      let finalFees = { ...semester.fees };
      let totalDue = semester.total;
      
      if (customization) {
        // Apply customizations
        Object.keys(customization.fees).forEach(feeType => {
          const customAmount = customization.fees[feeType as keyof typeof customization.fees];
          if (customAmount !== undefined) {
            finalFees[feeType as keyof typeof finalFees] = customAmount;
          }
        });
        
        // Recalculate total due based on customized fees
        totalDue = Object.values(finalFees).reduce((sum, fee) => sum + (fee || 0), 0);
      }
      
      const semesterPayments = payments.filter(
        payment => payment.semester === semester.semester && payment.paymentStatus === 'completed'
      );
      
      const totalPaid = semesterPayments.reduce((sum, payment) => sum + payment.amountPaid, 0);
      const outstanding = Math.max(0, totalDue - totalPaid);
      
      let paymentStatus: 'fully_paid' | 'partially_paid' | 'unpaid';
      if (totalPaid === 0) {
        paymentStatus = 'unpaid';
      } else if (totalPaid >= totalDue) {
        paymentStatus = 'fully_paid';
      } else {
        paymentStatus = 'partially_paid';
      }

      return {
        semester: semester.semester,
        semesterName: semester.semesterName,
        totalDue: totalDue,
        totalPaid,
        outstanding,
        paymentStatus,
        feeBreakdown: finalFees
      };
    });

    setSemesterDues(dues);
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsCreating(true);
    try {
      const paymentData = {
        studentId,
        paymentType: formData.paymentType,
        semester: formData.semester ? parseInt(formData.semester) : undefined,
        amountPaid: parseFloat(formData.amountPaid),
        paymentMethod: formData.paymentMethod,
        receiptNumber: formData.receiptNumber,
        ddNumber: formData.ddNumber,
        chequeNumber: formData.chequeNumber,
        bankName: formData.bankName,
        branchName: formData.branchName,
        depositDate: formData.depositDate || undefined,
        notes: formData.notes,
        feeBreakdown: formData.feeBreakdown
      };

      const response = await post<any>('/api/v1/student-payments/manual-payment', paymentData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Payment recorded successfully',
        });
        setShowCreateDialog(false);
        resetForm();
        fetchPaymentHistory();
        fetchPaymentSummary();
      } else {
        throw new Error(response.message || 'Failed to create payment');
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to record payment',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      paymentType: 'semester_payment',
      semester: '',
      amountPaid: '',
      paymentMethod: 'cash_office',
      receiptNumber: '',
      ddNumber: '',
      chequeNumber: '',
      bankName: '',
      branchName: '',
      depositDate: '',
      notes: '',
      feeBreakdown: []
    });
  };

  const downloadReceipt = async (paymentId: string) => {
    console.log('Attempting to download receipt for payment ID:', paymentId);
    
    if (!paymentId || paymentId === 'undefined') {
      toast({
        title: 'Error',
        description: 'Invalid payment ID. Cannot download receipt.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await get<Blob>(
        `/api/v1/student-payments/${paymentId}/receipt`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(response as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast({
        title: 'Error',
        description: 'Failed to download receipt',
        variant: 'destructive',
      });
    }
  };

  const getUnpaidSemesters = () => {
    return semesterDues.filter(due => due.paymentStatus !== 'fully_paid');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <CreditCard className="w-3 h-3" />;
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

  const getFeeTypeLabel = (feeType: string): string => {
    const labels: { [key: string]: string } = {
      admissionFee: 'Admission Fee',
      examPermitRegFee: 'Exam Permit/Reg Fee',
      specialFee: 'Special Fee',
      tuitionFee: 'Tuition Fee',
      feeFundCharges: 'Fee Fund Charges',
      others: 'Others',
      hostelFee: 'Hostel Fee'
    };
    return labels[feeType] || feeType;
  };

  if (!selectedStudent) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{selectedStudent.admissionNumber}</span>
                  <Badge variant="outline">{selectedStudent.department}</Badge>
                  <span>{selectedStudent.email}</span>
                </div>
              </div>
            </div>
            {canManagePayments && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Record Manual Payment</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreatePayment} className="space-y-4">
                    {/* Payment form content - same as before but cleaner layout */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="paymentType">Payment Type</Label>
                        <Select
                          value={formData.paymentType}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, paymentType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="semester_payment">Semester Payment</SelectItem>
                            <SelectItem value="partial_payment">Partial Payment</SelectItem>
                            <SelectItem value="hostel_fee">Hostel Fee</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(formData.paymentType === 'semester_payment' || formData.paymentType === 'partial_payment') && (
                        <div>
                          <Label htmlFor="semester">Semester</Label>
                          <Select
                            value={formData.semester}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, semester: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select semester" />
                            </SelectTrigger>
                            <SelectContent>
                              {semesterDues.filter(due => due.paymentStatus !== 'fully_paid').map(due => (
                                <SelectItem key={due.semester} value={due.semester.toString()}>
                                  {due.semesterName} - Outstanding: {formatCurrency(due.outstanding)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amountPaid">Amount Paid (₹)</Label>
                        <Input
                          id="amountPaid"
                          type="number"
                          step="0.01"
                          value={formData.amountPaid}
                          onChange={(e) => setFormData(prev => ({ ...prev, amountPaid: e.target.value }))}
                          placeholder="Enter amount"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select
                          value={formData.paymentMethod}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash_office">Cash (Office)</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="dd">Demand Draft</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="receiptNumber">Receipt Number</Label>
                      <Input
                        id="receiptNumber"
                        value={formData.receiptNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, receiptNumber: e.target.value }))}
                        placeholder="Enter receipt number (optional)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Transaction ID will be generated automatically by the system
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any additional notes..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                        disabled={isCreating}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isCreating}
                        className="flex items-center gap-1"
                      >
                        {isCreating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Recording...
                          </>
                        ) : (
                          <>
                            <Receipt className="w-4 h-4" />
                            Record Payment
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Payment Summary */}
      {paymentSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Payment Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(paymentSummary.totalAmountDue)}
                </p>
                <p className="text-sm text-gray-600">Total Due</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(paymentSummary.totalAmountPaid)}
                </p>
                <p className="text-sm text-gray-600">Total Paid</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(paymentSummary.totalOutstanding)}
                </p>
                <p className="text-sm text-gray-600">Outstanding</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {paymentSummary.completedPayments}
                </p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Dues Section */}
      {getUnpaidSemesters().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-orange-600" />
                Pending Dues ({getUnpaidSemesters().length} semesters)
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPendingDues(!showPendingDues)}
              >
                {showPendingDues ? 'Hide' : 'Show'} Details
              </Button>
            </CardTitle>
          </CardHeader>
          {showPendingDues && (
            <CardContent>
              <div className="space-y-4">
                {getUnpaidSemesters().map(due => (
                  <div key={due.semester} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-lg">{due.semesterName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Total Due: {formatCurrency(due.totalDue)}</span>
                          <span>Paid: {formatCurrency(due.totalPaid)}</span>
                          <span className="font-medium text-orange-600">
                            Outstanding: {formatCurrency(due.outstanding)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="secondary" 
                          className={
                            due.paymentStatus === 'unpaid' 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {due.paymentStatus === 'unpaid' ? 'Unpaid' : 'Partially Paid'}
                        </Badge>
                        {canManagePayments && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setFormData(prev => ({ 
                                ...prev, 
                                semester: due.semester.toString(),
                                paymentType: 'semester_payment'
                              }));
                              setShowCreateDialog(true);
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Record Payment
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Fee Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-sm">
                      {Object.entries(due.feeBreakdown).map(([feeType, amount]) => {
                        if (amount === 0) return null;
                        return (
                          <div key={feeType} className="p-2 bg-gray-50 rounded text-center">
                            <div className="text-xs text-gray-500 mb-1">{getFeeTypeLabel(feeType)}</div>
                            <div className="font-medium">{formatCurrency(amount)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Payment History */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="by-semester">By Semester</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Payment Records</span>
                <Button variant="outline" size="sm" onClick={fetchPaymentHistory}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Select
                  value={filters.academicYear}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, academicYear: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All academic years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="2024-25">2024-25</SelectItem>
                    <SelectItem value="2023-24">2023-24</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.paymentStatus}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, paymentStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.semester}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, semester: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All semesters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    {semesterDues.map(due => (
                      <SelectItem key={due.semester} value={due.semester.toString()}>
                        {due.semesterName}
                        {due.paymentStatus !== 'fully_paid' && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {due.paymentStatus === 'unpaid' ? 'Unpaid' : 'Partial'}
                          </Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No payment records found</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">
                                {payment.paymentType.replace('_', ' ').toUpperCase()}
                              </h3>
                              {payment.semester && (
                                <Badge variant="outline" className="text-xs">
                                  Semester {payment.semester}
                                </Badge>
                              )}
                              <Badge 
                                variant="secondary" 
                                className={`${getStatusColor(payment.paymentStatus)} flex items-center gap-1 text-xs`}
                              >
                                {getStatusIcon(payment.paymentStatus)}
                                {payment.paymentStatus.toUpperCase()}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {format(new Date(payment.paymentDate), 'dd MMM yyyy')}
                              </span>
                              <span>Method: {payment.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                              {payment.manualPaymentDetails?.receiptNumber && (
                                <span>Receipt: {payment.manualPaymentDetails.receiptNumber}</span>
                              )}
                              {payment.manualPaymentDetails?.transactionId && (
                                <span>TX ID: {payment.manualPaymentDetails.transactionId}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-lg">
                            {formatCurrency(payment.totalAmountCharged)}
                          </div>
                          {payment.convenienceFee > 0 && (
                            <div className="text-xs text-gray-500">
                              (Base: {formatCurrency(payment.amountPaid)} + Fee: {formatCurrency(payment.convenienceFee)})
                            </div>
                          )}
                          
                          <div className="flex space-x-1 mt-2">
                            {payment.paymentStatus === 'completed' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  const paymentId = payment._id || (payment as any).id || '';
                                  console.log('Payment object:', payment);
                                  console.log('Using payment ID:', paymentId);
                                  downloadReceipt(paymentId);
                                }}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Receipt
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-semester">
          <Card>
            <CardHeader>
              <CardTitle>Semester-wise Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {semesterDues.map(due => (
                  <div key={due.semester} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{due.semesterName}</h3>
                      <Badge 
                        variant="secondary" 
                        className={
                          due.paymentStatus === 'fully_paid'
                            ? 'bg-green-100 text-green-800'
                            : due.paymentStatus === 'partially_paid'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {due.paymentStatus === 'fully_paid' 
                          ? 'Fully Paid'
                          : due.paymentStatus === 'partially_paid'
                          ? 'Partially Paid'
                          : 'Unpaid'
                        }
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Total Due</div>
                        <div className="font-medium">{formatCurrency(due.totalDue)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Total Paid</div>
                        <div className="font-medium text-green-600">{formatCurrency(due.totalPaid)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Outstanding</div>
                        <div className="font-medium text-orange-600">{formatCurrency(due.outstanding)}</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            due.paymentStatus === 'fully_paid' 
                              ? 'bg-green-500' 
                              : due.paymentStatus === 'partially_paid'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ 
                            width: `${Math.min(100, (due.totalPaid / due.totalDue) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round((due.totalPaid / due.totalDue) * 100)}% paid
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};