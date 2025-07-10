'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { post } from '@/utilities/AxiosInterceptor';
import {
  UserPlus,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  User,
  GraduationCap,
  Loader2,
  Award,
  CircleCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { QuickAdmissionProgramSelection } from '@/components/QuickAdmissionProgramSelection';
import { toast } from '@/components/ui/use-toast';

interface FormData {
  fullName: string;
  mobile: string;
  classification: 'MQ' | 'GQ';
  programLevel: 'diploma' | 'mba' | '';
  programName: string;
  mode?: 'Regular' | 'Part-time' | 'LET';
  specialization?: string;
  branchPreferences?: Array<{
    branch: string;
    priority: number;
  }>;
  admissionNumber?: string;
}

const steps = [
  { id: 1, name: 'Basic Details', icon: User },
  { id: 2, name: 'Program Selection', icon: GraduationCap },
  { id: 3, name: 'Admission Number', icon: Award }
];

export default function QuickAdmission() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdApplicationId, setCreatedApplicationId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    mobile: '',
    classification: 'MQ',
    programLevel: '',
    programName: '',
    mode: undefined,
    specialization: undefined,
    branchPreferences: [],
    admissionNumber: undefined
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) {
      toast({
        title: "Error",
        description: "Full name is required",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.mobile || formData.mobile.length !== 10 || !/^\d{10}$/.test(formData.mobile)) {
      toast({
        title: "Error", 
        description: "Valid 10-digit mobile number is required",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleStep1Next = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateAnother = () => {
    setCreatedApplicationId(null);
    setFormData({
      fullName: '',
      mobile: '',
      classification: 'MQ',
      programLevel: '',
      programName: '',
      mode: undefined,
      specialization: undefined,
      branchPreferences: [],
      admissionNumber: undefined
    });
    setCurrentStep(1);
  };

  const validateStep2 = () => {
    if (!formData.programLevel || !formData.programName) {
      toast({
        title: "Error",
        description: "Please select a program to continue",
        variant: "destructive",
      });
      return false;
    }

    // For diploma programs, mode is required
    if (formData.programLevel === 'diploma' && !formData.mode) {
      toast({
        title: "Error",
        description: "Please select a mode for the diploma program",
        variant: "destructive",
      });
      return false;
    }

    // For diploma programs, at least one branch must be selected
    if (formData.programLevel === 'diploma' &&
        formData.mode &&
        (!formData.branchPreferences || formData.branchPreferences.length === 0)) {
      toast({
        title: "Error",
        description: "Please select at least one branch preference",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const validateStep3 = (): boolean => {
    if (!formData.admissionNumber || formData.admissionNumber.trim() === '') {
      toast({
        title: "Validation Error",
        description: "Please enter an admission number",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleStep2Next = () => {
    if (validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Show progress toast
      toast({
        title: "Creating Application",
        description: "Please wait while we create the admission application...",
      });

      // Step 1: Check admission number availability first
      const availabilityResponse = await post<any>('/api/v1/admission/admin/check-admission-number', {
        admissionNumber: formData.admissionNumber
      });

      if (!availabilityResponse.success || !availabilityResponse.data.available) {
        throw new Error(availabilityResponse.message || 'Admission number is not available');
      }

      // Step 2: Create application with admission number (auto-approved)
      const createResponse = await post<any>('/api/v1/admission/create-application', {
        mobile: formData.mobile,
        classification: formData.classification,
        admissionNumber: formData.admissionNumber
      });

      if (!createResponse.success) {
        throw new Error(createResponse.message || 'Failed to create application');
      }

      const applicationId = createResponse.data.applicationId;

      // Step 3: Save personal details
      const personalDetailsResponse = await post<any>('/api/v1/admission/personal-details', {
        applicationId,
        personalDetails: {
          fullName: formData.fullName,
          // Set minimal required fields for quick admission
          dob: new Date('2000-01-01').toISOString().split('T')[0], // Default DOB
          gender: 'male', // Default gender
          religion: 'Not specified', // Default religion
          email: `${formData.mobile}@temp.com` // Temporary email
        }
      });

      if (!personalDetailsResponse.success) {
        throw new Error(personalDetailsResponse.message || 'Failed to save personal details');
      }

      // Step 4: Save program selection
      const programSelections = [];

      if (formData.programLevel === 'diploma') {
        programSelections.push({
          programLevel: 'diploma',
          programName: formData.programName,
          mode: formData.mode,
          branchPreferences: formData.branchPreferences,
          selected: true,
          priority: 1
        });
      } else if (formData.programLevel === 'mba') {
        programSelections.push({
          programLevel: 'mba',
          programName: formData.programName,
          specialization: "General", // Default specialization for quick admission
          selected: true,
          priority: 1
        });
      }

      const programResponse = await post<any>(`/api/v1/admission/add-program-selection/${applicationId}`, {
        programSelections
      });

      if (!programResponse.success) {
        throw new Error(programResponse.message || 'Failed to save program selection');
      }

      // Success feedback (application is already approved with admission number)
      toast({
        title: "Application Created Successfully!",
        description: `Application ID: ${applicationId} with Admission Number: ${formData.admissionNumber}. Application has been automatically approved.`,
      });

      // Set the created application ID to show success state
      setCreatedApplicationId(applicationId);

    } catch (error: any) {
      console.error('Error creating quick admission:', error);

      // Enhanced error handling
      let errorMessage = "Failed to create application";

      if (error.message?.includes('admission number')) {
        errorMessage = "This admission number is already assigned. Please use a different admission number.";
      } else if (error.message?.includes('mobile')) {
        errorMessage = "This mobile number is already registered. Please use a different number.";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error Creating Application",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      {/* Desktop view */}
      <div className="hidden md:flex">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep >= step.id 
                ? 'bg-[#001c67] border-[#001c67] text-white' 
                : 'border-gray-300 text-gray-500'
            }`}>
              <step.icon className="w-5 h-5" />
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep >= step.id ? 'text-[#001c67]' : 'text-gray-500'
            }`}>
              {step.name}
            </span>
            {index < steps.length - 1 && (
              <ArrowRight className="w-4 h-4 text-gray-400 mx-4" />
            )}
          </div>
        ))}
      </div>

      {/* Mobile view */}
      <div className="md:hidden">
        <div className="flex justify-between">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              currentStep >= steps[currentStep - 1].id 
                ? 'bg-[#001c67] border-[#001c67] text-white' 
                : 'border-gray-300 text-gray-500'
            }`}>
              {React.createElement(steps[currentStep - 1].icon, { className: "w-4 h-4" })}
            </div>
            <span className="ml-2 text-sm font-medium text-[#001c67]">
              {steps[currentStep - 1].name}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            Step {currentStep} of {steps.length}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute requiredRoles={['super_admin', 'admission_officer']}>
      <DashboardLayout title="Quick Admission">
        <div className="bg-gray-50 min-h-full">
          <div className="mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Quick Admission</h1>
              <p className="text-gray-600 mt-2">
                Create admission applications quickly for applicants
              </p>
              <div className="mt-4">
                <Badge variant="outline">
                  <UserPlus className="w-3 h-3 mr-1" />
                  Admin Tool
                </Badge>
              </div>
            </div>

            {/* Step Indicator */}
            {renderStepIndicator()}

            {/* Form Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {createdApplicationId ? (
                    <>
                    </>
                  ) : currentStep === 1 ? (
                    <>
                      <User className="w-5 h-5" />
                      Basic Applicant Details
                    </>
                  ) : currentStep === 2 ? (
                    <>
                      <GraduationCap className="w-5 h-5" />
                      Program Selection
                    </>
                  ) : (
                    <>
                      <Award className="w-5 h-5" />
                      Admission Number Assignment
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {createdApplicationId
                    ? ""
                    : currentStep === 1
                      ? "Enter the basic information for the applicant"
                      : currentStep === 2
                        ? "Select the program for the applicant"
                        : "Assign admission number and approve the application"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {createdApplicationId ? (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center py-4 sm:py-6 lg:py-8">
                      <CircleCheck className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-green-600 mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-2 px-2">
                        Application Created Successfully!
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-4 px-4 sm:px-6">
                        The admission application has been created with the following details:
                      </p>

                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 text-left max-w-xs sm:max-w-md lg:max-w-lg mx-auto">
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                            <span className="font-medium text-sm sm:text-base">Application ID:</span>
                            <span className="text-[#001c67] font-mono text-sm sm:text-base break-all">{createdApplicationId}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                            <span className="font-medium text-sm sm:text-base">Applicant Name:</span>
                            <span className="text-sm sm:text-base break-words">{formData.fullName}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                            <span className="font-medium text-sm sm:text-base">Mobile Number:</span>
                            <span className="text-sm sm:text-base">{formData.mobile}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                            <span className="font-medium text-sm sm:text-base">Program:</span>
                            <span className="text-sm sm:text-base break-words">{formData.programName}</span>
                          </div>
                          {formData.mode && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                              <span className="font-medium text-sm sm:text-base">Mode:</span>
                              <span className="text-sm sm:text-base">{formData.mode}</span>
                            </div>
                          )}
                          {formData.admissionNumber && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                              <span className="font-medium text-sm sm:text-base">Admission Number:</span>
                              <span className="text-[#001c67] font-mono text-sm sm:text-base font-semibold">{formData.admissionNumber}</span>
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                            <span className="font-medium text-sm sm:text-base">Classification:</span>
                            <span className="text-sm sm:text-base">
                              {formData.classification === 'MQ' ? 'MQ (Management Quota)' : 'GQ (Government Quota)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 px-4 sm:px-6">
                        The application has been automatically approved and assigned an admission number.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
                      <Button
                        onClick={handleCreateAnother}
                        variant="outline"
                        className="w-full sm:w-auto rounded-none border-[#001c67] text-[#001c67] text-sm sm:text-base py-2 sm:py-3 px-4 sm:px-6"
                      >
                        Create Another Application
                      </Button>

                      <Button
                        onClick={() => router.push('/applications')}
                        className="w-full sm:w-auto bg-[#001c67] hover:bg-[#001c67]/80 text-white rounded-none text-sm sm:text-base py-2 sm:py-3 px-4 sm:px-6"
                      >
                        View All Applications
                      </Button>
                    </div>
                  </div>
                ) : currentStep === 1 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                          Full Name *
                        </Label>
                        <Input
                          id="fullName"
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          placeholder="Enter applicant's full name"
                          className="rounded-none"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mobile" className="text-sm font-medium text-gray-700">
                          Mobile Number *
                        </Label>
                        <Input
                          id="mobile"
                          type="tel"
                          value={formData.mobile}
                          onChange={(e) => handleInputChange('mobile', e.target.value)}
                          placeholder="Enter 10-digit mobile number"
                          className="rounded-none"
                          maxLength={10}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="classification" className="text-sm font-medium text-gray-700">
                        Classification *
                      </Label>
                      <Select
                        value={formData.classification}
                        onValueChange={(value: 'MQ' | 'GQ') => handleInputChange('classification', value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="rounded-none">
                          <SelectValue placeholder="Select classification" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MQ">MQ (Management Quota)</SelectItem>
                          <SelectItem value="GQ">GQ (Government Quota)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleStep1Next}
                        disabled={isSubmitting}
                        className="bg-[#001c67] hover:bg-[#001c67]/80 text-white rounded-none"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                ) : currentStep === 2 ? (
                  <div className="space-y-6">
                    {/* Program Selection Component */}
                    <QuickAdmissionProgramSelection
                      formData={formData}
                      onUpdate={handleInputChange}
                    />

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        className="rounded-none border-[#001c67] text-[#001c67]"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>

                      <Button
                        onClick={handleStep2Next}
                        disabled={isSubmitting}
                        className="bg-[#001c67] hover:bg-[#001c67]/80 text-white rounded-none"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="admissionNumber" className="text-sm font-medium text-gray-700">
                        Admission Number *
                      </Label>
                      <Input
                        id="admissionNumber"
                        type="text"
                        value={formData.admissionNumber || ''}
                        onChange={(e) => handleInputChange('admissionNumber', e.target.value)}
                        placeholder="Enter admission number (e.g., 2024-1234)"
                        className="rounded-none"
                        disabled={isSubmitting}
                      />
                      <p className="text-sm text-gray-500">
                        This admission number will be assigned to the applicant and the application will be automatically approved.
                      </p>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                        disabled={isSubmitting}
                        className="rounded-none border-[#001c67] text-[#001c67]"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>

                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-[#001c67] hover:bg-[#001c67]/80 text-white rounded-none"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Create Application
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
