'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { get, put, post } from '@/utilities/AxiosInterceptor';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  GraduationCap, 
  CreditCard, 
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit3,
  History,
  Calendar,
  Building2,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DepartmentAssignment } from '@/components/DepartmentAssignment';
import { AuditTrail } from '@/components/AuditTrail';
import { PaymentUpdateForm } from '@/components/PaymentUpdateForm';

interface ApplicationData {
  _id: string;
  applicationId: string;
  mobile: string;
  personalDetails: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    dob: string;
    gender: string;
    religion: string;
    email: string;
    mobile: string;
  };
  addressFamilyDetails: {
    address: {
      houseNumber: string;
      street: string;
      postOffice: string;
      pinCode: string;
      district: string;
      state: string;
      country: string;
    };
    parents: {
      fatherName: string;
      fatherMobile: string;
      motherName: string;
      motherMobile: string;
    };
    guardian: {
      guardianName: string;
      guardianPlace: string;
      guardianContact: string;
    };
  };
  programSelections: Array<{
    programLevel: string;
    programName: string;
    mode: string;
    specialization?: string;
    branchPreferences: Array<{
      branch: string;
      priority: number;
      _id: string;
    }>;
    selected: boolean;
    priority: number;
    _id: string;
  }>;
  educationDetails: {
    programDetails: {
      programLevel: string;
      programName: string;
      mode: string;
      specialization?: string;
      branchPreferences: Array<{
        branch: string;
        priority: number;
        _id: string;
      }>;
      selected: boolean;
      priority: number;
      _id: string;
    };
    entranceExams?: {
      kmat: { selected: boolean; score?: string };
      cmat: { selected: boolean; score?: string };
      cat: { selected: boolean; score?: string };
    };
    educationData: Array<{
      examination: string;
      passedFailed: string;
      groupTrade?: string;
      groupSubject?: string;
      period: string;
      yearOfPass: string;
      percentageMarks: string;
      registrationNumber?: string;
      noOfChances?: string;
      english?: string;
      physics?: string;
      chemistry?: string;
      maths?: string;
      boardUniversity?: string;
      _id: string;
    }>;
    subjectScores?: Array<{
      examination: string;
      physics: string;
      chemistry: string;
      maths: string;
      total: string;
      remarks: string;
    }>;
    achievements?: string;
    collegeName?: string;
  };
  paymentDetails?: {
    application_fee: {
      _id: string;
      amount: number;
      currency: string;
      status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
      paymentMethod: string;
      receipt: string;
      attempts?: number;
      lastError?: string;
      verifiedAt?: string;
      verifiedBy?: string;
      razorpayPaymentId?: string;
      razorpayOrderId?: string;
      statusHistory?: Array<{
        status: string;
        updatedBy: string;
        updatedAt: string;
        reason: string;
        previousStatus: string;
      }>;
      createdAt: string;
      updatedAt?: string;
    };
  };
  declaration?: {
    agreed: boolean;
    digitalSignature?: string;
    agreedAt?: string;
  };
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'waitlisted';
  currentStage: string;
  isExistingApplication?: boolean;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  reviewedAt?: string;
  adminRemarks?: string;
  admissionNumber?: string;
  department?: string;
  preferredBranches?: Array<{
    branch: string;
    priority: number;
    programLevel: string;
    programName: string;
    mode?: string;
    specialization?: string;
  }>;
  canAssignDepartment?: boolean;
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  const { hasPermission, hasRole, user } = useAuth();
  
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [auditTrailKey, setAuditTrailKey] = useState(0);
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [isCheckingAdmissionNumber, setIsCheckingAdmissionNumber] = useState(false);
  const [admissionNumberError, setAdmissionNumberError] = useState('');
  const [showAdmissionNumberInput, setShowAdmissionNumberInput] = useState(false);
  const [isFetchingNextAdmissionNumber, setIsFetchingNextAdmissionNumber] = useState(false);
  const [lastAssignedNumber, setLastAssignedNumber] = useState<string | null>(null);
  const [isManualInput, setIsManualInput] = useState(false);
  const admissionNumberInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchApplicationData = async () => {
      if (!applicationId) return;

      setIsLoading(true);
      try {
        const response = await get<any>(`/api/v1/admission/admin/${applicationId}`);
        
        if (response.success) {
          setApplicationData(response.data);
          setRemarks(response.data.adminRemarks || '');
        } else {
          throw new Error(response.message || 'Failed to fetch application data');
        }
      } catch (error) {
        console.error('Error fetching application data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load application data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicationData();
  }, [applicationId, toast, hasPermission]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const checkAdmissionNumberAvailability = async (admissionNumberToCheck: string) => {
    if (!admissionNumberToCheck.trim()) {
      setAdmissionNumberError('');
      return;
    }

    setIsCheckingAdmissionNumber(true);
    setAdmissionNumberError('');

    try {
      const response = await post<any>('/api/v1/admission/admin/check-admission-number', {
        admissionNumber: admissionNumberToCheck.trim()
      });

      if (response.success) {
        if (!response.data.available) {
          setAdmissionNumberError('This admission number is already assigned to another application');
        }
      } else {
        setAdmissionNumberError(response.message || 'Failed to check admission number');
      }
    } catch (error) {
      console.error('Error checking admission number:', error);
      setAdmissionNumberError('Failed to check admission number availability');
    } finally {
      setIsCheckingAdmissionNumber(false);
    }
  };

  const handleAdmissionNumberChange = useCallback((value: string) => {
    setAdmissionNumber(value);
    setIsManualInput(true); // Mark as manual input when user types
    
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    if (value.trim()) {
      // Store the current input element reference
      const currentInput = admissionNumberInputRef.current;
      const currentSelectionStart:any = currentInput?.selectionStart;
      const currentSelectionEnd:any = currentInput?.selectionEnd;
      
      // Debounce the availability check
      debounceTimeoutRef.current = setTimeout(() => {
        checkAdmissionNumberAvailability(value).finally(() => {
          // Restore focus and cursor position after API call
          if (currentInput && document.activeElement !== currentInput) {
            currentInput.focus();
            if (currentSelectionStart !== null && currentSelectionEnd !== null) {
              currentInput.setSelectionRange(currentSelectionStart, currentSelectionEnd);
            }
          }
        });
      }, 800); // Increased debounce time to reduce API calls
    } else {
      setAdmissionNumberError('');
    }
  }, []);

  const fetchNextAdmissionNumber = async () => {
    setIsFetchingNextAdmissionNumber(true);
    setAdmissionNumberError('');
    
    try {
      const response = await get<any>('/api/v1/admission/admin/next-admission-number');
      
      if (response.success && response.data?.nextAdmissionNumber) {
        setAdmissionNumber(response.data.nextAdmissionNumber);
        setLastAssignedNumber(response.data.lastAssignedNumber);
        setIsManualInput(false); // This is auto-filled, not manual
        
        const lastAssigned = response.data.lastAssignedNumber;
        const nextNumber = response.data.nextAdmissionNumber;
        
        toast({
          title: 'Auto-filled',
          description: `Admission number auto-filled with: ${nextNumber}`,
        });
      } else {
        throw new Error(response.message || 'Failed to get next admission number');
      }
    } catch (error) {
      console.error('Error fetching next admission number:', error);
      toast({
        title: 'Auto-fill Failed',
        description: 'Could not auto-fill admission number. Please enter manually.',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingNextAdmissionNumber(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!applicationData) return;

    // Prevent status changes FROM approved status (unless super_admin)
    // Admission officers can approve, but once approved, only super_admin can change it
    if (applicationData.status === 'approved' && !hasRole('super_admin')) {
      toast({
        title: 'Cannot Change Status',
        description: 'Application status cannot be changed once approved. Contact administrator if changes are needed.',
        variant: 'destructive',
      });
      return;
    }

    // If approving and admission number is required
    if (newStatus === 'approved' && !applicationData.admissionNumber) {
      if (!admissionNumber.trim()) {
        toast({
          title: 'Admission Number Required',
          description: 'Please enter an admission number to approve the application.',
          variant: 'destructive',
        });
        return;
      }

      if (admissionNumberError) {
        toast({
          title: 'Invalid Admission Number',
          description: admissionNumberError,
          variant: 'destructive',
        });
        return;
      }
    }

    setStatusUpdateLoading(true);
    try {
      const requestBody: any = {
        status: newStatus,
        remarks: remarks
      };

      // Include admission number if approving
      if (newStatus === 'approved' && admissionNumber.trim()) {
        requestBody.admissionNumber = admissionNumber.trim();
      }

      const response = await put<any>(`/api/v1/admission/admin/${applicationData._id}/status`, requestBody);

      if (response.success) {
        // Update the application data with the new status and any updated fields from the response
        setApplicationData({
          ...applicationData,
          status: newStatus as 'pending' | 'under_review' | 'approved' | 'rejected' | 'waitlisted',
          adminRemarks: remarks,
          reviewedBy: response.data?.reviewedBy || applicationData.reviewedBy,
          reviewedAt: response.data?.reviewedAt || applicationData.reviewedAt,
          admissionNumber: response.data?.admissionNumber || applicationData.admissionNumber
        });
        
        const successMessage = newStatus === 'approved' && response.data?.admissionNumber 
          ? `Application ${newStatus} successfully. Admission Number: ${response.data.admissionNumber}`
          : `Application ${newStatus} successfully`;
        
        toast({
          title: 'Success',
          description: successMessage,
        });
        
        // Clear admission number input after successful approval
        if (newStatus === 'approved') {
          setAdmissionNumber('');
          setAdmissionNumberError('');
          setShowAdmissionNumberInput(false);
        }
        
        // Refresh audit trail to show the new status change
        setAuditTrailKey(prev => prev + 1);
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update application status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        variant: 'destructive',
      });
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleDepartmentAssigned = (newDepartment: string) => {
    if (applicationData) {
      setApplicationData({
        ...applicationData,
        department: newDepartment
      });
      // Refresh audit trail to show the new department assignment log
      setAuditTrailKey(prev => prev + 1);
    }
  };

  const handlePaymentUpdate = (updatedPayment: any) => {
    if (applicationData) {
      setApplicationData({
        ...applicationData,
        paymentDetails: {
          ...applicationData.paymentDetails,
          application_fee: updatedPayment
        }
      });
      // Refresh audit trail to show the payment update log
      setAuditTrailKey(prev => prev + 1);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy hh:mm a');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'waitlisted':
        return 'bg-blue-100 text-blue-800';
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
      case 'waitlisted':
        return <AlertCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getCurrentStageDisplay = (stage: string) => {
    const stageMap: Record<string, string> = {
      'mobile_verification': 'Mobile Verification',
      'personal_details': 'Personal Details',
      'address_family_details': 'Address & Family Details',
      'application_fee_payment': 'Application Fee Payment',
      'program_selection': 'Program Selection',
      'education_details': 'Education Details',
      'declaration': 'Declaration',
      'submitted': 'Application Submitted'
    };
    return stageMap[stage] || stage;
  };


  if (isLoading) {
    return (
      <ProtectedRoute requiredPermissions={['view_all_applications', 'view_department_applications']} allowAny={true}>
        <DashboardLayout title="Application Details">
             <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full"></div>
      </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!applicationData) {
    return (
      <ProtectedRoute requiredPermissions={['view_all_applications', 'view_department_applications']} allowAny={true}>
        <DashboardLayout title="Application Details">
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">Application Not Found</h2>
              <p className="text-gray-600 mt-2">The requested application could not be found.</p>
            </div>
            <Button onClick={() => router.push('/applications')} variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back to Applications
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={['view_all_applications', 'view_department_applications']} allowAny={true}>
      <DashboardLayout title="Application Details">
        <div className="space-y-6 p-6 overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Button onClick={() => router.push('/applications')} size="sm" variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Applications
                </Button>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">Application Details</h1>
              <p className="text-gray-600 text-sm">Application ID: {applicationData.applicationId}</p>
              {applicationData.admissionNumber && (
                <p className="text-green-700 text-sm font-medium">
                  Admission Number: <span className="font-bold">{applicationData.admissionNumber}</span>
                </p>
              )}
            </div>
            <div className="flex items-start space-x-2">
              <Badge className={getStatusColor(applicationData.status)}>
                {getStatusIcon(applicationData.status)}
                <span className="ml-1">{applicationData.status.toUpperCase()}</span>
              </Badge>
              <Badge variant="outline">
                {getCurrentStageDisplay(applicationData.currentStage)}
              </Badge>
              {/* Edit Button - Only for Super Admins and Admission Officers */}
              {hasPermission('edit_applications') && (
                <Button 
                  onClick={() => router.push(`/applications/${applicationData.applicationId}/edit`)}
                  size="sm" 
                  className="bg-[#001c67] hover:bg-[#001c67]/90 text-white"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Application
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="h-[76vh]">
            <div className="space-y-6">

              {/* Department Management Section */}
              {(hasPermission('edit_applications') && (applicationData.canAssignDepartment || hasPermission('update_application_status'))) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Building2 className="w-5 h-5 mr-2" />
                      Department Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Current Department Status */}
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Current Department</Label>
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                            {applicationData.department ? (
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{applicationData.department}</span>
                                <Badge variant="default" className="text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Assigned
                                </Badge>
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-500">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                <span>No department assigned</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Preferred Branches Display */}
                        {applicationData.preferredBranches && applicationData.preferredBranches.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Applicant&apos;s Preferred Branches</Label>
                            <div className="mt-2 space-y-2">
                              {applicationData.preferredBranches
                                .sort((a, b) => a.priority - b.priority)
                                .slice(0, 3) // Show only top 3 preferences
                                .map((branch, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                                    <div className="flex items-center space-x-2">
                                      <Badge variant="outline" className="text-xs">
                                        {branch.priority}
                                      </Badge>
                                      <span className="text-sm font-medium text-blue-900">{branch.branch}</span>
                                      {applicationData.department === branch.branch && (
                                        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                          Current
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              {applicationData.preferredBranches.length > 3 && (
                                <p className="text-xs text-gray-500">
                                  +{applicationData.preferredBranches.length - 3} more preferences
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Department Assignment Actions */}
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Department Assignment</Label>
                          <div className="mt-2 space-y-3">
                            <DepartmentAssignment
                              applicationId={applicationData.applicationId}
                              currentDepartment={applicationData.department}
                              onDepartmentAssigned={handleDepartmentAssigned}
                            />
                            
                            <div className="text-xs text-gray-500 space-y-1">
                              <p>• Departments can be assigned from applicant&apos;s preferred branches</p>
                              <p>• Manual assignment to any department is also allowed</p>
                              <p>• All assignments are logged for audit purposes</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Application Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="w-5 h-5 mr-2" />
                    Application Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Created Date</Label>
                      <p className="text-sm text-gray-900">{formatDate(applicationData.createdAt)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Last Updated</Label>
                      <p className="text-sm text-gray-900">{formatDate(applicationData.updatedAt)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Mobile Number</Label>
                      <p className="text-sm text-gray-900">{applicationData.mobile}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Department</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-sm text-gray-900">
                          {applicationData.department || 'Not assigned'}
                        </p>
                        {applicationData.department && (
                          <Badge variant="outline" className="text-xs">
                            Assigned
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <User className="w-5 h-5 mr-2" />
                    Personal Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                      <p className="text-sm text-gray-900">
                        {applicationData.personalDetails.fullName || 
                         `${applicationData.personalDetails.firstName} ${applicationData.personalDetails.lastName}`}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
                      <p className="text-sm text-gray-900">{formatDate(applicationData.personalDetails.dob)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Gender</Label>
                      <p className="text-sm text-gray-900 capitalize">{applicationData.personalDetails.gender}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Religion</Label>
                      <p className="text-sm text-gray-900 capitalize">{applicationData.personalDetails.religion}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Email</Label>
                      <p className="text-sm text-gray-900">{applicationData.personalDetails.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Mobile</Label>
                      <p className="text-sm text-gray-900">{applicationData.personalDetails.mobile}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address & Family Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <MapPin className="w-5 h-5 mr-2" />
                    Address & Family Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {applicationData.addressFamilyDetails ? (
                    <>
                      {/* Address */}
                      <div className=" p-4 rounded-lg border ">
                        <h3 className="font-medium  mb-3 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          Residential Address
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium">House Number</Label>
                            <p className="text-sm ">{applicationData.addressFamilyDetails.address?.houseNumber || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Street</Label>
                            <p className="text-sm ">{applicationData.addressFamilyDetails.address?.street || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Post Office</Label>
                            <p className="text-sm ">{applicationData.addressFamilyDetails.address?.postOffice || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Pin Code</Label>
                            <p className="text-sm ">{applicationData.addressFamilyDetails.address?.pinCode || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">District</Label>
                            <p className="text-sm ">{applicationData.addressFamilyDetails.address?.district || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">State</Label>
                            <p className="text-sm ">{applicationData.addressFamilyDetails.address?.state || '-'}</p>
                          </div>
                        </div>
                        {/* Complete Address */}
                        <div className="mt-3 p-3 bg-white rounded border ">
                          <Label className="text-sm font-medium">Complete Address</Label>
                          <p className="text-sm  mt-1">
                            {[
                              applicationData.addressFamilyDetails.address?.houseNumber,
                              applicationData.addressFamilyDetails.address?.street,
                              applicationData.addressFamilyDetails.address?.postOffice,
                              applicationData.addressFamilyDetails.address?.district,
                              applicationData.addressFamilyDetails.address?.state,
                              applicationData.addressFamilyDetails.address?.pinCode
                            ].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>

                      {/* Parents Details */}
                      <div className="p-4 rounded-lg border">
                        <h3 className="font-medium  mb-3 flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          Parents Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Father Details */}
                          <div className="p-3 bg-white rounded border">
                            <h4 className="font-medium mb-2">Father&apos;s Information</h4>
                            <div className="space-y-2">
                              <div>
                                <Label className="text-sm font-medium">Name</Label>
                                <p className="text-sm ">{applicationData.addressFamilyDetails.parents?.fatherName || '-'}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Mobile</Label>
                                <p className="text-sm ">{applicationData.addressFamilyDetails.parents?.fatherMobile || '-'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Mother Details */}
                          <div className="p-3 bg-white rounded border">
                            <h4 className="font-medium mb-2">Mother&apos;s Information</h4>
                            <div className="space-y-2">
                              <div>
                                <Label className="text-sm font-medium">Name</Label>
                                <p className="text-sm ">{applicationData.addressFamilyDetails.parents?.motherName || '-'}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Mobile</Label>
                                <p className="text-sm ">{applicationData.addressFamilyDetails.parents?.motherMobile || '-'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Guardian Details */}
                      <div className=" p-4 rounded-lg border">
                        <h3 className="font-medium  mb-3 flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          Guardian Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium ">Name</Label>
                            <p className="text-sm ">{applicationData.addressFamilyDetails.guardian?.guardianName || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium ">Place</Label>
                            <p className="text-sm ">{applicationData.addressFamilyDetails.guardian?.guardianPlace || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium ">Contact</Label>
                            <p className="text-sm ">{applicationData.addressFamilyDetails.guardian?.guardianContact || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No address and family details available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Program Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Program Selection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {applicationData.programSelections?.map((program, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${program.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{program.programName}</p>
                          <p className="text-sm text-gray-600">Level: {program.programLevel}</p>
                        </div>
                        {program.selected && (
                          <Badge variant="default">Selected</Badge>
                        )}
                      </div>
                      {program.mode && (
                        <p className="text-sm text-gray-600 mb-2">Mode: {program.mode}</p>
                      )}
                      {program.specialization && (
                        <p className="text-sm text-gray-600 mb-2">Specialization: {program.specialization}</p>
                      )}
                      {program.branchPreferences && program.branchPreferences.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Branch Preferences:</p>
                          <div className="flex flex-wrap gap-2">
                            {program.branchPreferences
                              .sort((a, b) => a.priority - b.priority)
                              .map((branch) => (
                                <Badge key={branch._id} variant="outline" className="text-xs">
                                  {branch.priority}. {branch.branch}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Education Details */}
              <Card className="rounded-none border-secondary/20">
                <CardHeader className="px-3 sm:px-4 py-3">
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Education Details ({applicationData.educationDetails?.programDetails?.programLevel?.toUpperCase() || 'N/A'})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 pb-4">
                  {applicationData.educationDetails ? (
                    <>
                      {/* Header Info */}
                      <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 p-3 border rounded-lg">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-1 uppercase tracking-wide">Education Qualifications</h3>
                        <p className="text-xs text-gray-600">
                          Academic qualifications for {applicationData.educationDetails?.programDetails?.programName || 'this program'} admission.
                        </p>
                      </div>

                      {/* Education Cards */}
                      <div className="space-y-3">
                        {applicationData.educationDetails?.educationData?.map((education, index) => (
                          <Card key={education._id || index} className={`transition-all duration-200 ${
                            education.examination === 'SSLC/THSLC/CBSE' || education.examination === '+2/VHSE' || education.examination === 'Degree' 
                              ? 'ring-2 ring-red-100 border-red-200 bg-red-50/30' 
                              : 'border-gray-200'
                          }`}>
                            <CardHeader className="pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
                              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-2">
                                <CardTitle className="text-xs sm:text-sm font-semibold flex flex-wrap items-center gap-2">
                                  <span className="bg-secondary/10 text-secondary px-2 py-1 rounded-full text-xs font-medium flex-shrink-0">
                                    {index + 1}
                                  </span>
                                  <span className="break-words text-xs sm:text-sm">{education.examination}</span>
                                  {(education.examination === 'SSLC/THSLC/CBSE' || education.examination === '+2/VHSE' || education.examination === 'Degree') && (
                                    <Badge variant="destructive" className="text-xs flex-shrink-0 px-1.5 py-0.5">
                                      Required
                                    </Badge>
                                  )}
                                </CardTitle>
                                
                                {/* Status Badge */}
                                <div className="flex justify-start sm:justify-end">
                                  <Badge variant="default" className={`text-xs px-2 py-1 ${
                                    education.passedFailed === 'Passed' 
                                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                                      : "bg-red-100 text-red-800 hover:bg-red-100"
                                  }`}>
                                    {education.passedFailed === 'Passed' ? '✓' : '✗'} {education.passedFailed}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-2 px-3 pb-3 sm:px-4 sm:pb-4">
                              {/* Form Grid - Responsive */}
                              <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
                                
                                {/* Group/Subject - Not for SSLC */}
                                {education.examination !== "SSLC/THSLC/CBSE" && (education.groupTrade || education.groupSubject) && (
                                  <div className="bg-gray-50 p-2 rounded">
                                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                      {education.examination === "Degree" ? "Subject" : "Group"}
                                    </Label>
                                    <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-1">{education.groupTrade || education.groupSubject}</p>
                                  </div>
                                )}

                                {/* Year of Pass */}
                                {education.yearOfPass && (
                                  <div className="bg-gray-50 p-2 rounded">
                                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Year</Label>
                                    <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-1">{education.yearOfPass}</p>
                                  </div>
                                )}

                                {/* Percentage */}
                                {education.percentageMarks && (
                                  <div className="bg-gray-50 p-2 rounded">
                                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Percentage</Label>
                                    <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-1">{education.percentageMarks}%</p>
                                  </div>
                                )}

                                {/* Registration Number for all programs */}
                                <div className="bg-gray-50 p-2 rounded">
                                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Reg. No.</Label>
                                  <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-1 break-all">{education.registrationNumber || 'N/A'}</p>
                                </div>

                                {/* Board/University for MBA programs */}
                                {education.boardUniversity && (
                                  <div className="bg-gray-50 p-2 rounded">
                                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Board/University</Label>
                                    <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-1 break-all">{education.boardUniversity}</p>
                                  </div>
                                )}

                                {/* Subject Marks for specific examinations */}
                                {(education.english || education.physics || education.chemistry || education.maths) && (
                                  <div className="col-span-full">
                                    <Label className="text-xs font-medium text-gray-700">Subject Marks</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                                      {education.english && (
                                        <div className="text-center p-2 bg-gray-50 rounded">
                                          <Label className="text-xs text-gray-600">English</Label>
                                          <p className="text-sm font-medium">{education.english}</p>
                                        </div>
                                      )}
                                      {education.physics && (
                                        <div className="text-center p-2 bg-gray-50 rounded">
                                          <Label className="text-xs text-gray-600">Physics</Label>
                                          <p className="text-sm font-medium">{education.physics}</p>
                                        </div>
                                      )}
                                      {education.chemistry && (
                                        <div className="text-center p-2 bg-gray-50 rounded">
                                          <Label className="text-xs text-gray-600">Chemistry</Label>
                                          <p className="text-sm font-medium">{education.chemistry}</p>
                                        </div>
                                      )}
                                      {education.maths && (
                                        <div className="text-center p-2 bg-gray-50 rounded">
                                          <Label className="text-xs text-gray-600">Maths</Label>
                                          <p className="text-sm font-medium">{education.maths}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Completion Status Indicator */}
                              <div className="pt-2">
                                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 text-xs text-gray-500">
                                  <span className="font-medium">Completion Status:</span>
                                  <div className="flex flex-wrap items-center gap-3 sm:gap-2">
                                    {[
                                      { field: 'yearOfPass', label: 'Year', value: education.yearOfPass },
                                      { field: 'percentageMarks', label: '%', value: education.percentageMarks },
                                      { field: 'registrationNumber', label: 'Reg', value: education.registrationNumber }
                                    ].map(({ field, label, value }) => (
                                      <div key={field} className="flex items-center gap-1">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                          value && value !== 'N/A' ? 'bg-green-500' : 'bg-gray-300'
                                        }`} />
                                        <span className={`text-xs ${value && value !== 'N/A' ? 'text-green-600' : 'text-gray-400'}`}>
                                          {label}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )) || (
                          <div className="text-center py-8 text-gray-500">
                            <p>No education details available</p>
                          </div>
                        )}
                      </div>

                      {/* Entrance Exams Section - Only for MBA programs */}
                      {applicationData.educationDetails?.entranceExams && 
                       applicationData.educationDetails?.programDetails?.programLevel?.toLowerCase() === 'mba' && (
                        <Card className="border-purple-200 bg-purple-50/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-purple-800">
                              Entrance Examination Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                              {/* KMAT */}
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded-full ${
                                    applicationData.educationDetails.entranceExams.kmat?.selected ? 'bg-purple-600' : 'bg-gray-300'
                                  }`} />
                                  <Label className="text-sm font-medium text-purple-800">KMAT</Label>
                                </div>
                                {applicationData.educationDetails.entranceExams.kmat?.selected && applicationData.educationDetails.entranceExams.kmat?.score && (
                                  <div className="ml-5">
                                    <Label className="text-xs text-gray-600">Score</Label>
                                    <p className="text-sm font-medium">{applicationData.educationDetails.entranceExams.kmat.score}</p>
                                  </div>
                                )}
                                {!applicationData.educationDetails.entranceExams.kmat?.selected && (
                                  <p className="text-xs text-gray-500 ml-5">Not attempted</p>
                                )}
                              </div>

                              {/* CMAT */}
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded-full ${
                                    applicationData.educationDetails.entranceExams.cmat?.selected ? 'bg-purple-600' : 'bg-gray-300'
                                  }`} />
                                  <Label className="text-sm font-medium text-purple-800">CMAT</Label>
                                </div>
                                {applicationData.educationDetails.entranceExams.cmat?.selected && applicationData.educationDetails.entranceExams.cmat?.score && (
                                  <div className="ml-5">
                                    <Label className="text-xs text-gray-600">Score</Label>
                                    <p className="text-sm font-medium">{applicationData.educationDetails.entranceExams.cmat.score}</p>
                                  </div>
                                )}
                                {!applicationData.educationDetails.entranceExams.cmat?.selected && (
                                  <p className="text-xs text-gray-500 ml-5">Not attempted</p>
                                )}
                              </div>

                              {/* CAT */}
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded-full ${
                                    applicationData.educationDetails.entranceExams.cat?.selected ? 'bg-purple-600' : 'bg-gray-300'
                                  }`} />
                                  <Label className="text-sm font-medium text-purple-800">CAT</Label>
                                </div>
                                {applicationData.educationDetails.entranceExams.cat?.selected && applicationData.educationDetails.entranceExams.cat?.score && (
                                  <div className="ml-5">
                                    <Label className="text-xs text-gray-600">Score</Label>
                                    <p className="text-sm font-medium">{applicationData.educationDetails.entranceExams.cat.score}</p>
                                  </div>
                                )}
                                {!applicationData.educationDetails.entranceExams.cat?.selected && (
                                  <p className="text-xs text-gray-500 ml-5">Not attempted</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Additional Education Information */}
                      {applicationData.educationDetails?.achievements && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Achievements/Work Experience</Label>
                          <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{applicationData.educationDetails.achievements}</p>
                        </div>
                      )}
                      
                      {applicationData.educationDetails?.collegeName && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">College Name (UG)</Label>
                          <p className="text-sm text-gray-900 mt-1">{applicationData.educationDetails.collegeName}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <GraduationCap className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No education details available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Details */}
              <PaymentUpdateForm
                applicationId={applicationData._id}
                paymentDetails={applicationData.paymentDetails?.application_fee || null}
                onPaymentUpdate={handlePaymentUpdate}
                canEdit={hasRole('super_admin') || hasRole('admission_officer')}
              />

              {/* Declaration */}
              {applicationData.declaration?.agreed && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <FileText className="w-5 h-5 mr-2" />
                      Declaration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-900">Declaration agreed</span>
                      </div>
                      {applicationData.declaration.agreedAt && (
                        <p className="text-sm text-gray-600">
                          Agreed on: {formatDateTime(applicationData.declaration.agreedAt)}
                        </p>
                      )}
                      {applicationData.declaration.digitalSignature && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Digital Signature</Label>
                          <p className="text-sm text-gray-900">{applicationData.declaration.digitalSignature}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
 
                       {/* Status Update Section */}
              {(hasPermission('update_application_status') || hasRole('admission_officer')) && (
                <Card data-status-section>
                  <CardHeader>
                    <CardTitle className="text-lg">Status Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Display approved status information */}
                    {applicationData.status === 'approved' ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-900" />
                            <span className="text-lg font-semibold text-green-900">Application Approved</span>
                          </div>
                          <Badge className="bg-green-100 text-green-900 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {applicationData.admissionNumber && (
                            <div>
                              <Label className="text-green-900 font-medium">Admission Number:</Label>
                              <p className="text-green-900 mt-1 font-bold text-lg">{applicationData.admissionNumber}</p>
                            </div>
                          )}
                          {applicationData.reviewedBy && (
                            <div>
                              <Label className="text-green-900 font-medium">Approved By:</Label>
                              <p className="text-green-900 mt-1">{applicationData.reviewedBy.name}</p>
                              <p className="text-green-900 text-xs">{applicationData.reviewedBy.email}</p>
                            </div>
                          )}
                          {applicationData.reviewedAt && (
                            <div>
                              <Label className="text-green-900 font-medium">Approved At:</Label>
                              <p className="text-green-900 mt-1">{formatDateTime(applicationData.reviewedAt)}</p>
                            </div>
                          )}
                        </div>
                        
                        {applicationData.adminRemarks && (
                          <div>
                            <Label className="text-green-900 font-medium">Admin Remarks:</Label>
                            <p className="text-green-900 mt-1 bg-green-50 p-2 rounded border border-green-700">
                              {applicationData.adminRemarks}
                            </p>
                          </div>
                        )}
                        
                        <div className="pt-2 border-t border-green-200">
                          <p className="text-green-900 text-sm">
                            <AlertCircle className="w-4 h-4 inline mr-1" />
                            {hasRole('super_admin') 
                              ? 'As super admin, you can override this status if needed.'
                              : 'Status cannot be changed once approved. Contact administrator if changes are needed.'
                            }
                          </p>
                        </div>
                        
                        {/* Super Admin Override Section */}
                        {hasRole('super_admin') && (
                          <div className="pt-3 border-t border-green-200">
                            <Label className="text-green-900 font-medium text-sm mb-2 block">Super Admin Override:</Label>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate('under_review')}
                                disabled={statusUpdateLoading}
                                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                              >
                                Set Under Review
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate('rejected')}
                                disabled={statusUpdateLoading}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate('waitlisted')}
                                disabled={statusUpdateLoading}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                              >
                                Waitlist
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Update Status</Label>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant={applicationData.status === 'under_review' ? 'default' : 'outline'}
                              onClick={() => handleStatusUpdate('under_review')}
                              disabled={statusUpdateLoading}
                            >
                              Under Review
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (!applicationData.admissionNumber) {
                                  setShowAdmissionNumberInput(true);
                                  // Auto-fill the next admission number
                                  await fetchNextAdmissionNumber();
                                } else {
                                  handleStatusUpdate('approved');
                                }
                              }}
                              disabled={statusUpdateLoading || isFetchingNextAdmissionNumber}
                            >
                              {isFetchingNextAdmissionNumber ? 'Loading...' : 'Approve'}
                            </Button>
                            <Button
                              size="sm"
                              variant={applicationData.status === 'rejected' ? 'default' : 'outline'}
                              onClick={() => handleStatusUpdate('rejected')}
                              disabled={statusUpdateLoading}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant={applicationData.status === 'waitlisted' ? 'default' : 'outline'}
                              onClick={() => handleStatusUpdate('waitlisted')}
                              disabled={statusUpdateLoading}
                            >
                              Waitlist
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="remarks" className="text-sm font-medium">Admin Remarks</Label>
                          <Textarea
                            id="remarks"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Add remarks..."
                            className="mt-2"
                            rows={3}
                          />
                        </div>
                      </div>
                      
                      {showAdmissionNumberInput && !applicationData.admissionNumber && (
                        <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="admissionNumber" className="text-sm font-medium text-blue-900">
                                  Enter Admission Number <span className="text-red-500">*</span> (Last Number : {lastAssignedNumber})
                                </Label>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={fetchNextAdmissionNumber}
                                  disabled={isFetchingNextAdmissionNumber || isCheckingAdmissionNumber}
                                  className="text-blue-600 hover:text-blue-700 p-1 h-auto"
                                >
                                  {isFetchingNextAdmissionNumber ? 'Getting...' : 'Auto-fill Next'}
                                </Button>
                              </div>
                              <Input
                                ref={admissionNumberInputRef}
                                id="admissionNumber"
                                type="text"
                                value={admissionNumber}
                                onChange={(e) => handleAdmissionNumberChange(e.target.value)}
                                placeholder="e.g., MAD/2025-26/1234"
                                className="mt-1"
                              />
                              {isCheckingAdmissionNumber && (
                                <p className="text-xs text-blue-600 mt-1">Checking availability...</p>
                              )}
                              {admissionNumberError && (
                                <p className="text-xs text-red-600 mt-1">{admissionNumberError}</p>
                              )}
                              {admissionNumber && !admissionNumberError && !isCheckingAdmissionNumber && (
                                <p className="text-xs text-green-600 mt-1">✓ Admission number is available</p>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate('approved')}
                                disabled={statusUpdateLoading || !admissionNumber.trim() || !!admissionNumberError || isCheckingAdmissionNumber}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {statusUpdateLoading ? 'Approving...' : 'Approve with Admission Number'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setShowAdmissionNumberInput(false);
                                  setAdmissionNumber('');
                                  setAdmissionNumberError('');
                                }}
                                disabled={statusUpdateLoading}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}


              {/* Audit Trail - Only visible to users with edit permissions */}
              {hasPermission('edit_applications') && (
                <AuditTrail 
                  applicationId={applicationId}
                  refreshKey={auditTrailKey}
                />
              )}
            </div>
          </ScrollArea>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}