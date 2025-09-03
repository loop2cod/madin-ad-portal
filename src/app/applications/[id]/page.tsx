'use client';

import React, { useState, useEffect } from 'react';
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
      status: string;
      paymentMethod: string;
      receipt: string;
      verifiedAt?: string;
      createdAt: string;
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

  const handleAdmissionNumberChange = (value: string) => {
    setAdmissionNumber(value);
    if (value.trim()) {
      // Debounce the availability check
      const timeoutId = setTimeout(() => {
        checkAdmissionNumberAvailability(value);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setAdmissionNumberError('');
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

  const renderEducationTable = () => {
    if (!applicationData?.educationDetails?.educationData) return null;

    const educationData = applicationData.educationDetails.educationData;
    const selectedProgram = applicationData.programSelections?.find(p => p.selected);
    
    // Check if this is MBA program
    const isMBA = selectedProgram?.programName?.toLowerCase().includes('mba');
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-secondary/10">
              {!isMBA && <th className="border border-gray-300 p-2 text-left text-sm font-medium">Sl.</th>}
              <th className="border border-gray-300 p-2 text-left text-sm font-medium">Examination</th>
              <th className="border border-gray-300 p-2 text-left text-sm font-medium">Passed/Failed</th>
              <th className="border border-gray-300 p-2 text-left text-sm font-medium">
                {isMBA ? 'Group/Subject' : 'Group/Trade'}
              </th>
              <th className="border border-gray-300 p-2 text-left text-sm font-medium">Period</th>
              <th className="border border-gray-300 p-2 text-left text-sm font-medium">Year of Pass</th>
              <th className="border border-gray-300 p-2 text-left text-sm font-medium">% of Marks</th>
              {isMBA && <th className="border border-gray-300 p-2 text-left text-sm font-medium">Board/University</th>}
              {!isMBA && <th className="border border-gray-300 p-2 text-left text-sm font-medium">No. of Chances</th>}
              {!isMBA && <th className="border border-gray-300 p-2 text-left text-sm font-medium">English</th>}
              {!isMBA && <th className="border border-gray-300 p-2 text-left text-sm font-medium">Physics</th>}
              {!isMBA && <th className="border border-gray-300 p-2 text-left text-sm font-medium">Chemistry</th>}
              {!isMBA && <th className="border border-gray-300 p-2 text-left text-sm font-medium">Maths</th>}
            </tr>
          </thead>
          <tbody>
            {educationData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {!isMBA && <td className="border border-gray-300 p-2 text-center font-medium">{index + 1}</td>}
                <td className="border border-gray-300 p-2 text-sm">{row.examination}</td>
                <td className="border border-gray-300 p-2 text-sm capitalize">{row.passedFailed}</td>
                <td className="border border-gray-300 p-2 text-sm">{row.groupTrade || row.groupSubject}</td>
                <td className="border border-gray-300 p-2 text-sm">{row.period}</td>
                <td className="border border-gray-300 p-2 text-sm">{row.yearOfPass}</td>
                <td className="border border-gray-300 p-2 text-sm">{row.percentageMarks}%</td>
                {isMBA && <td className="border border-gray-300 p-2 text-sm">{row.boardUniversity}</td>}
                {!isMBA && <td className="border border-gray-300 p-2 text-sm">{row.noOfChances}</td>}
                {!isMBA && <td className="border border-gray-300 p-2 text-sm">{row.english}</td>}
                {!isMBA && <td className="border border-gray-300 p-2 text-sm">{row.physics}</td>}
                {!isMBA && <td className="border border-gray-300 p-2 text-sm">{row.chemistry}</td>}
                {!isMBA && <td className="border border-gray-300 p-2 text-sm">{row.maths}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSubjectScoresTable = () => {
    if (!applicationData?.educationDetails?.subjectScores || 
        applicationData.educationDetails.subjectScores.length === 0) return null;

    return (
      <div className="mt-6">
        <h3 className="font-medium text-gray-900 mb-3">Subject-wise Scores</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-secondary/10">
                <th className="border border-gray-300 p-2 text-left text-sm font-medium">Examination</th>
                <th className="border border-gray-300 p-2 text-left text-sm font-medium">Physics (%)</th>
                <th className="border border-gray-300 p-2 text-left text-sm font-medium">Chemistry (%)</th>
                <th className="border border-gray-300 p-2 text-left text-sm font-medium">Maths (%)</th>
                <th className="border border-gray-300 p-2 text-left text-sm font-medium">Total</th>
                <th className="border border-gray-300 p-2 text-left text-sm font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {applicationData.educationDetails.subjectScores.map((row, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2 text-sm">{row.examination}</td>
                  <td className="border border-gray-300 p-2 text-sm">{row.physics}%</td>
                  <td className="border border-gray-300 p-2 text-sm">{row.chemistry}%</td>
                  <td className="border border-gray-300 p-2 text-sm">{row.maths}%</td>
                  <td className="border border-gray-300 p-2 text-sm">{row.total}</td>
                  <td className="border border-gray-300 p-2 text-sm">{row.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderEntranceExams = () => {
    if (!applicationData?.educationDetails?.entranceExams) return null;

    const exams = applicationData.educationDetails.entranceExams;
    const selectedExams = Object.entries(exams).filter(([, exam]) => exam.selected);

    if (selectedExams.length === 0) return null;

    return (
      <div className="mt-6">
        <h3 className="font-medium text-gray-900 mb-3">Entrance Examinations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {selectedExams.map(([examName, exam]) => (
            <div key={examName} className="p-3 bg-gray-50 rounded-md">
              <p className="font-medium text-sm text-gray-900">{examName.toUpperCase()}</p>
              <p className="text-sm text-gray-600">Score: {exam.score || 'Not provided'}</p>
            </div>
          ))}
        </div>
      </div>
    );
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Education Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {applicationData.educationDetails ? (
                    <>
                      {/* Program Details Summary */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="font-medium text-blue-900 mb-2">Selected Program</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-blue-800">Program Level</Label>
                            <p className="text-sm text-blue-900 capitalize">{applicationData.educationDetails.programDetails?.programLevel}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-blue-800">Program Name</Label>
                            <p className="text-sm text-blue-900">{applicationData.educationDetails.programDetails?.programName}</p>
                          </div>
                          {applicationData.educationDetails.programDetails?.mode && (
                            <div>
                              <Label className="text-sm font-medium text-blue-800">Mode</Label>
                              <p className="text-sm text-blue-900">{applicationData.educationDetails.programDetails.mode}</p>
                            </div>
                          )}
                          {applicationData.educationDetails?.programDetails?.specialization && (
                            <div>
                              <Label className="text-sm font-medium text-blue-800">Specialization</Label>
                              <p className="text-sm text-blue-900">{applicationData.educationDetails.programDetails.specialization}</p>
                            </div>
                          )}
                        </div>
                        {applicationData.educationDetails.programDetails?.branchPreferences && 
                         applicationData.educationDetails.programDetails.branchPreferences.length > 0 && (
                          <div className="mt-3">
                            <Label className="text-sm font-medium text-blue-800">Branch Preferences</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {applicationData.educationDetails.programDetails.branchPreferences
                                .sort((a, b) => a.priority - b.priority)
                                .map((branch, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-blue-100 text-blue-800">
                                    {branch.priority}. {branch.branch}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Education Data Table */}
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Academic Qualifications</h3>
                        {renderEducationTable()}
                      </div>

                      {/* Subject Scores Table */}
                      {renderSubjectScoresTable()}

                      {/* Entrance Exams */}
                      {renderEntranceExams()}
                      
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
                              onClick={() => {
                                if (!applicationData.admissionNumber) {
                                  setShowAdmissionNumberInput(true);
                                } else {
                                  handleStatusUpdate('approved');
                                }
                              }}
                              disabled={statusUpdateLoading}
                            >
                              Approve
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
                              <Label htmlFor="admissionNumber" className="text-sm font-medium text-blue-900">
                                Enter Admission Number <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="admissionNumber"
                                type="text"
                                value={admissionNumber}
                                onChange={(e) => handleAdmissionNumberChange(e.target.value)}
                                placeholder="e.g., MAD/2025-26/1234"
                                className="mt-1"
                                disabled={isCheckingAdmissionNumber}
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