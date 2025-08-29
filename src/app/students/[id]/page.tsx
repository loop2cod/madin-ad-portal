'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { get } from '@/utilities/AxiosInterceptor';
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
  History,
  Calendar,
  Building2,
  IdCard,
  Mail,
  Phone,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StudentFeeManagement } from '@/components/StudentFeeManagement';

interface StudentLoginData {
  id: string;
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
  updatedAt: string;
}

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
}

interface FeeAssignment {
  _id: string;
  student: {
    _id: string;
    name: string;
    admissionNumber: string;
    department: string;
  };
  feeStructure: {
    _id: string;
    title: string;
    type: string;
    academicYear: string;
  };
  feeStructureSnapshot: {
    id: string;
    _id?: string;
    type: string;
    title: string;
    academicYear: string;
    description?: string;
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
    effectiveDate: string;
  };
  customizations: Array<{
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
  assignedBy: {
    name: string;
    email: string;
  };
  assignedAt: string;
  notes?: string;
  isActive: boolean;
}

interface StudentDetailsData {
  studentLogin: StudentLoginData;
  applicationData: ApplicationData;
  feeAssignment: FeeAssignment | null;
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const { hasPermission } = useAuth();
  
  const [studentData, setStudentData] = useState<StudentDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const handleFeeAssignmentUpdate = (updatedAssignment: FeeAssignment) => {
    setStudentData(prev => prev ? {
      ...prev,
      feeAssignment: updatedAssignment
    } : null);
  };

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentId) return;

      setIsLoading(true);
      try {
        const response = await get<any>(`/api/v1/admin/students/${studentId}/details`);
        
        if (response.success) {
          setStudentData(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch student data');
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load student data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId, toast]);

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

  const renderEducationTable = () => {
    if (!studentData?.applicationData.educationDetails?.educationData) return null;

    const educationData = studentData.applicationData.educationDetails.educationData;
    const selectedProgram = studentData.applicationData.programSelections?.find(p => p.selected);
    
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
    if (!studentData?.applicationData.educationDetails?.subjectScores || 
        studentData.applicationData.educationDetails.subjectScores.length === 0) return null;

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
              {studentData.applicationData.educationDetails.subjectScores.map((row, index: number) => (
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
    if (!studentData?.applicationData.educationDetails?.entranceExams) return null;

    const exams = studentData.applicationData.educationDetails.entranceExams;
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
      <ProtectedRoute requiredPermissions={['view_all_users']}>
        <DashboardLayout title="Student Details">
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!studentData) {
    return (
      <ProtectedRoute requiredPermissions={['view_all_users']}>
        <DashboardLayout title="Student Details">
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">Student Not Found</h2>
              <p className="text-gray-600 mt-2">The requested student could not be found.</p>
            </div>
            <Button onClick={() => router.push('/students')} variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back to Students
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const { studentLogin, applicationData } = studentData;

  return (
    <ProtectedRoute requiredPermissions={['view_all_users']}>
      <DashboardLayout title="Student Details">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Button onClick={() => router.push('/students')} size="sm" variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Students
                </Button>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">Student Details</h1>
              <p className="text-gray-600 text-sm">
                Student ID: {studentLogin.id} | Application ID: {applicationData.applicationId}
              </p>
              {studentLogin.admissionNumber && (
                <p className="text-green-700 text-sm font-medium">
                  Admission Number: <span className="font-bold">{studentLogin.admissionNumber}</span>
                </p>
              )}
            </div>
            <div className="flex items-start space-x-2">
              <Badge className={studentLogin.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {studentLogin.isActive ? (
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
              <Badge className={getStatusColor(applicationData.status)}>
                {getStatusIcon(applicationData.status)}
                <span className="ml-1">{applicationData.status.toUpperCase()}</span>
              </Badge>
            </div>
          </div>

          <ScrollArea className="h-[76vh]">
            <div className="space-y-6">
              
              {/* Student Login Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Login Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Name</Label>
                      <p className="text-sm text-gray-900">{studentLogin.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Email</Label>
                      <p className="text-sm text-gray-900">{studentLogin.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Mobile</Label>
                      <p className="text-sm text-gray-900">{studentLogin.mobile}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Department</Label>
                      <p className="text-sm text-gray-900">{studentLogin.department}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Account Created</Label>
                      <p className="text-sm text-gray-900">{formatDate(studentLogin.createdAt)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Last Login</Label>
                      <p className="text-sm text-gray-900">
                        {studentLogin.lastLogin ? formatDateTime(studentLogin.lastLogin) : 'Never logged in'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">First Login Status</Label>
                      <div className="flex items-center space-x-2">
                        {studentLogin.isFirstLogin ? (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Role</Label>
                      <Badge variant="secondary" className="text-xs">
                        {studentLogin.role}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                      <Label className="text-sm font-medium text-gray-700">Application Status</Label>
                      <Badge className={getStatusColor(applicationData.status)}>
                        {getStatusIcon(applicationData.status)}
                        <span className="ml-1">{applicationData.status.toUpperCase()}</span>
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Applied Date</Label>
                      <p className="text-sm text-gray-900">{formatDate(applicationData.createdAt)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Last Updated</Label>
                      <p className="text-sm text-gray-900">{formatDate(applicationData.updatedAt)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Department</Label>
                      <p className="text-sm text-gray-900">{applicationData.department || 'Not assigned'}</p>
                    </div>
                    {applicationData.reviewedBy && (
                      <>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Reviewed By</Label>
                          <p className="text-sm text-gray-900">{applicationData.reviewedBy.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Reviewed Date</Label>
                          <p className="text-sm text-gray-900">
                            {applicationData.reviewedAt ? formatDate(applicationData.reviewedAt) : 'N/A'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  {applicationData.adminRemarks && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium text-gray-700">Admin Remarks</Label>
                      <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                        {applicationData.adminRemarks}
                      </p>
                    </div>
                  )}
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
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <p className="text-sm text-gray-900">{applicationData.personalDetails.email}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Mobile</Label>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <p className="text-sm text-gray-900">{applicationData.personalDetails.mobile}</p>
                      </div>
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
                      <div className="p-4 rounded-lg border">
                        <h3 className="font-medium mb-3 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          Residential Address
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium">House Number</Label>
                            <p className="text-sm">{applicationData.addressFamilyDetails.address?.houseNumber || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Street</Label>
                            <p className="text-sm">{applicationData.addressFamilyDetails.address?.street || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Post Office</Label>
                            <p className="text-sm">{applicationData.addressFamilyDetails.address?.postOffice || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Pin Code</Label>
                            <p className="text-sm">{applicationData.addressFamilyDetails.address?.pinCode || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">District</Label>
                            <p className="text-sm">{applicationData.addressFamilyDetails.address?.district || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">State</Label>
                            <p className="text-sm">{applicationData.addressFamilyDetails.address?.state || '-'}</p>
                          </div>
                        </div>
                        {/* Complete Address */}
                        <div className="mt-3 p-3 bg-white rounded border">
                          <Label className="text-sm font-medium">Complete Address</Label>
                          <p className="text-sm mt-1">
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
                        <h3 className="font-medium mb-3 flex items-center">
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
                                <p className="text-sm">{applicationData.addressFamilyDetails.parents?.fatherName || '-'}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Mobile</Label>
                                <p className="text-sm">{applicationData.addressFamilyDetails.parents?.fatherMobile || '-'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Mother Details */}
                          <div className="p-3 bg-white rounded border">
                            <h4 className="font-medium mb-2">Mother&apos;s Information</h4>
                            <div className="space-y-2">
                              <div>
                                <Label className="text-sm font-medium">Name</Label>
                                <p className="text-sm">{applicationData.addressFamilyDetails.parents?.motherName || '-'}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Mobile</Label>
                                <p className="text-sm">{applicationData.addressFamilyDetails.parents?.motherMobile || '-'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Guardian Details */}
                      <div className="p-4 rounded-lg border">
                        <h3 className="font-medium mb-3 flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          Guardian Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Name</Label>
                            <p className="text-sm">{applicationData.addressFamilyDetails.guardian?.guardianName || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Place</Label>
                            <p className="text-sm">{applicationData.addressFamilyDetails.guardian?.guardianPlace || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Contact</Label>
                            <p className="text-sm">{applicationData.addressFamilyDetails.guardian?.guardianContact || '-'}</p>
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
                  {/* Always show education section - will show appropriate message if no data */}
                    <>
                      {/* Program Details Summary */}
                      {((studentData.applicationData.educationDetails?.programDetails) || 
                        (studentData.applicationData.programSelections?.find(p => p.selected))) && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h3 className="font-medium text-blue-900 mb-2">Selected Program</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-blue-800">Program Level</Label>
                              <p className="text-sm text-blue-900 capitalize">
                                {studentData.applicationData.educationDetails?.programDetails?.programLevel || 
                                 studentData.applicationData.programSelections?.find(p => p.selected)?.programLevel}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-blue-800">Program Name</Label>
                              <p className="text-sm text-blue-900">
                                {studentData.applicationData.educationDetails?.programDetails?.programName || 
                                 studentData.applicationData.programSelections?.find(p => p.selected)?.programName}
                              </p>
                            </div>
                            {(studentData.applicationData.educationDetails?.programDetails?.mode || 
                              studentData.applicationData.programSelections?.find(p => p.selected)?.mode) && (
                              <div>
                                <Label className="text-sm font-medium text-blue-800">Mode</Label>
                                <p className="text-sm text-blue-900">
                                  {studentData.applicationData.educationDetails?.programDetails?.mode || 
                                   studentData.applicationData.programSelections?.find(p => p.selected)?.mode}
                                </p>
                              </div>
                            )}
                            {(studentData.applicationData.educationDetails?.programDetails?.specialization || 
                              studentData.applicationData.programSelections?.find(p => p.selected)?.specialization) && (
                              <div>
                                <Label className="text-sm font-medium text-blue-800">Specialization</Label>
                                <p className="text-sm text-blue-900">
                                  {studentData.applicationData.educationDetails?.programDetails?.specialization || 
                                   studentData.applicationData.programSelections?.find(p => p.selected)?.specialization}
                                </p>
                              </div>
                            )}
                          </div>
                          {(() => {
                            const selectedProgram = studentData.applicationData.programSelections?.find(p => p.selected);
                            const educationBranches = studentData.applicationData.educationDetails?.programDetails?.branchPreferences;
                            const selectionBranches = selectedProgram?.branchPreferences;
                            
                            const hasBranches = (educationBranches && educationBranches.length > 0) || 
                                              (selectionBranches && selectionBranches.length > 0);
                            
                            if (!hasBranches) return null;
                            
                            return (
                              <div className="mt-3">
                                <Label className="text-sm font-medium text-blue-800">Branch Preferences</Label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {(educationBranches || selectionBranches)
                                    ?.sort((a, b) => a.priority - b.priority)
                                    .map((branch, index) => (
                                      <Badge key={index} variant="outline" className="text-xs bg-blue-100 text-blue-800">
                                        {branch.priority}. {branch.branch}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Education Data Table */}
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Academic Qualifications</h3>
                        {(studentData.applicationData.educationDetails?.educationData && 
                          studentData.applicationData.educationDetails.educationData.length > 0) ? (
                          renderEducationTable()
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-lg border">
                            <p className="text-sm text-gray-600 text-center">
                              {studentData.applicationData.educationDetails ? 
                                'Academic qualification data is being processed or not yet available.' :
                                'Academic qualifications will be displayed once the student completes their education details.'
                              }
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Subject Scores Table */}
                      {renderSubjectScoresTable()}

                      {/* Entrance Exams */}
                      {renderEntranceExams()}
                      
                      {/* Additional Education Information */}
                      {studentData.applicationData.educationDetails?.achievements && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Achievements/Work Experience</Label>
                          <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{studentData.applicationData.educationDetails.achievements}</p>
                        </div>
                      )}
                      
                      {studentData.applicationData.educationDetails?.collegeName && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">College Name (UG)</Label>
                          <p className="text-sm text-gray-900 mt-1">{studentData.applicationData.educationDetails.collegeName}</p>
                        </div>
                      )}
                    </>
                </CardContent>
              </Card>

              {/* Payment Details */}
              {studentData.applicationData.paymentDetails?.application_fee && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Payment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Amount</Label>
                        <p className="text-sm text-gray-900">
                          ₹{studentData.applicationData.paymentDetails.application_fee.amount} {studentData.applicationData.paymentDetails.application_fee.currency}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Status</Label>
                        <Badge variant={studentData.applicationData.paymentDetails.application_fee.status === 'verified' ? 'default' : 'secondary'}>
                          {studentData.applicationData.paymentDetails.application_fee.status}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Payment Method</Label>
                        <p className="text-sm text-gray-900">{studentData.applicationData.paymentDetails.application_fee.paymentMethod}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Receipt</Label>
                        <p className="text-sm text-gray-900">{studentData.applicationData.paymentDetails.application_fee.receipt}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Payment Date</Label>
                        <p className="text-sm text-gray-900">{formatDate(studentData.applicationData.paymentDetails.application_fee.createdAt)}</p>
                      </div>
                      {studentData.applicationData.paymentDetails.application_fee.verifiedAt && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Verified Date</Label>
                          <p className="text-sm text-gray-900">{formatDate(studentData.applicationData.paymentDetails.application_fee.verifiedAt)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Declaration */}
              {studentData.applicationData.declaration?.agreed && (
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
                      {studentData.applicationData.declaration.agreedAt && (
                        <p className="text-sm text-gray-600">
                          Agreed on: {formatDateTime(studentData.applicationData.declaration.agreedAt)}
                        </p>
                      )}
                      {studentData.applicationData.declaration.digitalSignature && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Digital Signature</Label>
                          <p className="text-sm text-gray-900">{studentData.applicationData.declaration.digitalSignature}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fee Structure Management */}
              {(() => {
                console.log('Rendering Fee Management:', { studentLogin: !!studentLogin, studentId: studentLogin?.id, feeAssignment: !!studentData.feeAssignment });
                return (
                  <StudentFeeManagement
                    studentId={studentLogin?.id || 'undefined'}
                    feeAssignment={studentData.feeAssignment}
                    onFeeAssignmentUpdate={handleFeeAssignmentUpdate}
                  />
                );
              })()}
            </div>
          </ScrollArea>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}