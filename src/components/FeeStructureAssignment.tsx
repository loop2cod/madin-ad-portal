'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { get, post, patch } from '@/utilities/AxiosInterceptor';
import { useToast } from '@/components/ui/use-toast';
import { 
  CreditCard, 
  Plus,
  ChevronDown,
  ChevronUp,
  Edit,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { FeeStructure, FeeStructureType, FEE_STRUCTURE_TYPES } from '@/types/fee-structure';

interface FeeStructureAssignmentProps {
  applicationId: string;
  currentFeeStructure?: any;
  studentFeeAssignment?: any;
  onFeeStructureAssigned: (assignedFeeStructure: any) => void;
  canAssign: boolean;
  applicationData?: {
    status: string;
    admissionNumber?: string;
    programSelections?: Array<{
      programLevel: string;
      programName: string;
      mode: string;
      specialization?: string;
      selected: boolean;
    }>;
  };
}

export const FeeStructureAssignment: React.FC<FeeStructureAssignmentProps> = ({
  applicationId,
  currentFeeStructure,
  studentFeeAssignment: propStudentFeeAssignment,
  onFeeStructureAssigned,
  canAssign,
  applicationData
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [availableFeeStructures, setAvailableFeeStructures] = useState<FeeStructure[]>([]);
  const [selectedFeeStructureId, setSelectedFeeStructureId] = useState<string>('');
  const [isLoadingFeeStructures, setIsLoadingFeeStructures] = useState(false);
  const [expandedSemesters, setExpandedSemesters] = useState<{ [key: number]: boolean }>({});
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  
  // Student ID for API calls
  const [studentId, setStudentId] = useState<string | null>(null);
  
  // Customization state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<number | null>(null);
  const [editingFees, setEditingFees] = useState<{[key: string]: number}>({});
  const [editReason, setEditReason] = useState('');
  const [isCustomizing, setIsCustomizing] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (canAssign && applicationData?.status === 'approved') {
      fetchAvailableFeeStructures();
    }
    // Fetch student ID if admission number is available
    if (applicationData?.admissionNumber) {
      fetchStudentId();
    }
  }, [canAssign, applicationData?.status, applicationData?.admissionNumber]);

  const fetchAvailableFeeStructures = async () => {
    setIsLoadingFeeStructures(true);
    try {
      const response = await get<any>('/api/v1/admin/fee-structures/active');
      
      if (response.success) {
        setAvailableFeeStructures(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to fetch fee structures');
      }
    } catch (error) {
      console.error('Error fetching fee structures:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available fee structures',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingFeeStructures(false);
    }
  };

  const fetchStudentId = async () => {
    if (!applicationData?.admissionNumber) return;
    
    try {
      // Find student by admission number using the students API
      const studentsResponse = await get<any>('/api/v1/admin/students', {
        params: {
          admissionNumber: applicationData.admissionNumber,
          limit: 1
        }
      });
      
      if (studentsResponse.success && studentsResponse.data?.students?.length > 0) {
        setStudentId(studentsResponse.data.students[0]._id);
      }
    } catch (error) {
      console.error('Error fetching student ID:', error);
    }
  };

  const handleAssignFeeStructure = async () => {
    if (!selectedFeeStructureId || selectedFeeStructureId === 'no-fee-structures') {
      toast({
        title: 'Selection Required',
        description: 'Please select a fee structure to assign',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      let response;
      
      // Use Student API if student ID is available (preferred method)
      if (studentId) {
        response = await post<any>(`/api/v1/admin/students/${studentId}/assign-fee-structure`, {
          feeStructureId: selectedFeeStructureId,
          notes: '' // Can add notes field if needed
        });
        
        if (response.success) {
          // For student API, we need to refresh the application data to show the new assignment
          // The parent component should handle this by refetching the application data
          onFeeStructureAssigned({ studentFeeAssignment: response.data });
        }
      } else {
        // Fallback to Application API
        response = await post<any>(`/api/v1/admission/admin/${applicationId}/assign-fee-structure`, {
          feeStructureId: selectedFeeStructureId
        });
        
        if (response.success) {
          onFeeStructureAssigned(response.data);
        }
      }

      if (response.success) {
        setSelectedFeeStructureId('');
        setAssignDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Fee structure assigned successfully',
        });
      } else {
        throw new Error(response.message || 'Failed to assign fee structure');
      }
    } catch (error) {
      console.error('Error assigning fee structure:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign fee structure',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  const getSelectedProgramInfo = () => {
    const selectedProgram = applicationData?.programSelections?.find(program => program.selected);
    if (selectedProgram) {
      return {
        level: selectedProgram.programLevel,
        name: selectedProgram.programName,
        mode: selectedProgram.mode,
        specialization: selectedProgram.specialization
      };
    }
    return null;
  };

  const getRecommendedFeeStructures = () => {
    const programInfo = getSelectedProgramInfo();
    if (!programInfo) return availableFeeStructures;

    return availableFeeStructures.filter(feeStructure => {
      const type = feeStructure.type;
      const programLevel = programInfo.level.toLowerCase();
      const mode = programInfo.mode?.toLowerCase();

      if (mode === 'evening' && type === 'evening') return true;
      if (programLevel === 'lateral_entry' && type === 'lateral_entry') return true;
      if (type === 'regular') return true;
      
      return false;
    }).sort((a, b) => {
      const aScore = getMatchScore(a, programInfo);
      const bScore = getMatchScore(b, programInfo);
      return bScore - aScore;
    });
  };

  const getMatchScore = (feeStructure: FeeStructure, programInfo: any) => {
    let score = 0;
    const type = feeStructure.type;
    const mode = programInfo.mode?.toLowerCase();
    const level = programInfo.level.toLowerCase();

    if (mode === 'evening' && type === 'evening') score += 3;
    if (level === 'lateral_entry' && type === 'lateral_entry') score += 3;
    if (type === 'regular') score += 1;

    return score;
  };

  const toggleSemesterExpansion = (semester: number) => {
    setExpandedSemesters(prev => ({
      ...prev,
      [semester]: !prev[semester]
    }));
  };

  const getFeeTypeLabel = (feeType: string): string => {
    const labels: { [key: string]: string } = {
      admissionFee: 'Admission Fee',
      examPermitRegFee: 'Exam Permit/Reg Fee',
      specialFee: 'Special Fee',
      tuitionFee: 'Tuition Fee',
      others: 'Others'
    };
    return labels[feeType] || feeType;
  };

  // Get effective fees after customizations
  const getEffectiveFees = (semester: any) => {
    // Check both student fee assignment and application fee structure customizations
    const studentCustomizations = propStudentFeeAssignment?.customizations;
    const applicationCustomizations = currentFeeStructure?.customizations;
    
    // Student customizations take priority
    const customizations = studentCustomizations || applicationCustomizations;
    
    if (!customizations) return semester.fees;
    
    const customization = customizations.find((c: any) => c.semester === semester.semester);
    if (!customization) return semester.fees;

    const effectiveFees = { ...semester.fees };
    Object.keys(customization.fees).forEach(feeType => {
      if (customization.fees[feeType] !== undefined) {
        effectiveFees[feeType] = customization.fees[feeType];
      }
    });
    return effectiveFees;
  };

  // Calculate effective total
  const getEffectiveTotal = (semester: any) => {
    const effectiveFees = getEffectiveFees(semester);
    return Object.values(effectiveFees).reduce((sum: number, fee: any) => sum + (fee || 0), 0);
  };

  // Check if semester has customizations
  const hasCustomizations = (semester: any) => {
    const studentCustomizations = propStudentFeeAssignment?.customizations;
    const applicationCustomizations = currentFeeStructure?.customizations;
    const customizations = studentCustomizations || applicationCustomizations;
    
    return customizations?.some((c: any) => c.semester === semester.semester);
  };

  // Get customization details
  const getCustomizationDetails = (semester: any) => {
    const studentCustomizations = propStudentFeeAssignment?.customizations;
    const applicationCustomizations = currentFeeStructure?.customizations;
    const customizations = studentCustomizations || applicationCustomizations;
    
    return customizations?.find((c: any) => c.semester === semester.semester);
  };

  // Handle opening edit dialog
  const handleEditSemester = (semester: any) => {
    setEditingSemester(semester.semester);
    setEditingFees({ ...getEffectiveFees(semester) }); // Use effective fees like Student Details
    setEditReason('');
    setEditDialogOpen(true);
  };

  // Handle updating fee structure with customizations
  const handleUpdateFeeStructure = async () => {
    if (editingSemester === null || !editingFees) {
      return;
    }

    setIsCustomizing(true);
    try {
      let response;
      
      // Use Student API if student ID is available (preferred method)
      if (studentId) {
        response = await patch<any>(`/api/v1/admin/students/${studentId}/update-fee-structure`, {
          semester: editingSemester,
          feeCustomizations: editingFees,
          reason: editReason
        });
        
        if (response.success) {
          // For student API, we need to refresh the application data to show the new customization
          onFeeStructureAssigned({ studentFeeAssignment: response.data });
        }
      } else {
        // Fallback to Application API
        response = await patch<any>(`/api/v1/admission/admin/${applicationId}/customize-fee-structure`, {
          semester: editingSemester,
          feeCustomizations: editingFees,
          reason: editReason
        });
        
        if (response.success) {
          onFeeStructureAssigned(response.data);
        }
      }

      if (response.success) {
        setEditDialogOpen(false);
        setEditingSemester(null);
        setEditingFees({});
        setEditReason('');
        toast({
          title: 'Success',
          description: 'Semester fees customized successfully',
        });
      } else {
        throw new Error(response.message || 'Failed to customize fees');
      }
    } catch (error) {
      console.error('Error customizing fees:', error);
      toast({
        title: 'Error',
        description: 'Failed to customize semester fees',
        variant: 'destructive',
      });
    } finally {
      setIsCustomizing(false);
    }
  };

  // Don't show the component if application is not approved
  if (!applicationData || applicationData.status !== 'approved') {
    return null;
  }

  const programInfo = getSelectedProgramInfo();
  const recommendedFeeStructures = getRecommendedFeeStructures();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Fee Structure Assignment
          </div>
          {canAssign && (
            <Button
              onClick={() => setAssignDialogOpen(true)}
              size="sm"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4 mr-2" />
              {currentFeeStructure || propStudentFeeAssignment ? 'Reassign' : 'Assign'} Fee Structure
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentFeeStructure || propStudentFeeAssignment ? (
          <>
            {/* Current Assignment Info */}
            {(() => {
              // Determine which fee structure to display (student assignment takes priority)
              const displayFeeStructure = propStudentFeeAssignment || currentFeeStructure;
              const isFromStudentSystem = !!propStudentFeeAssignment;
              
              return (
                <div className={`p-4 rounded-lg border ${isFromStudentSystem ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                  <h3 className={`font-medium mb-2 ${isFromStudentSystem ? 'text-green-900' : 'text-blue-900'}`}>
                    Currently Assigned Fee Structure 
                    {isFromStudentSystem && <span className="text-xs font-normal"> (via Student Management)</span>}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className={`text-sm font-medium ${isFromStudentSystem ? 'text-green-800' : 'text-blue-800'}`}>Title</Label>
                      <p className={`text-sm ${isFromStudentSystem ? 'text-green-900' : 'text-blue-900'}`}>
                        {isFromStudentSystem ? displayFeeStructure.feeStructure.title : displayFeeStructure.title}
                      </p>
                    </div>
                    <div>
                      <Label className={`text-sm font-medium ${isFromStudentSystem ? 'text-green-800' : 'text-blue-800'}`}>Type</Label>
                      <Badge variant="outline" className={`text-xs ${isFromStudentSystem ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {isFromStudentSystem 
                          ? (FEE_STRUCTURE_TYPES[displayFeeStructure.feeStructure.type as FeeStructureType] || displayFeeStructure.feeStructure.type)
                          : (FEE_STRUCTURE_TYPES[displayFeeStructure.type as FeeStructureType] || displayFeeStructure.type)
                        }
                      </Badge>
                    </div>
                    <div>
                      <Label className={`text-sm font-medium ${isFromStudentSystem ? 'text-green-800' : 'text-blue-800'}`}>Academic Year</Label>
                      <p className={`text-sm ${isFromStudentSystem ? 'text-green-900' : 'text-blue-900'}`}>
                        {isFromStudentSystem ? displayFeeStructure.feeStructure.academicYear : displayFeeStructure.academicYear}
                      </p>
                    </div>
                    <div>
                      <Label className={`text-sm font-medium ${isFromStudentSystem ? 'text-green-800' : 'text-blue-800'}`}>Total Amount</Label>
                      <p className={`text-sm font-semibold ${isFromStudentSystem ? 'text-green-900' : 'text-blue-900'}`}>
                        {formatCurrency(isFromStudentSystem ? displayFeeStructure.feeStructureSnapshot.grandTotal : displayFeeStructure.grandTotal)}
                      </p>
                    </div>
                    <div>
                      <Label className={`text-sm font-medium ${isFromStudentSystem ? 'text-green-800' : 'text-blue-800'}`}>Assigned By</Label>
                      <p className={`text-sm ${isFromStudentSystem ? 'text-green-900' : 'text-blue-900'}`}>
                        {isFromStudentSystem ? displayFeeStructure.assignedBy.name : displayFeeStructure.assignedBy?.name}
                      </p>
                    </div>
                    <div>
                      <Label className={`text-sm font-medium ${isFromStudentSystem ? 'text-green-800' : 'text-blue-800'}`}>Assigned Date</Label>
                      <p className={`text-sm ${isFromStudentSystem ? 'text-green-900' : 'text-blue-900'}`}>
                        {formatDate(isFromStudentSystem ? displayFeeStructure.assignedAt : displayFeeStructure.assignedAt)}
                      </p>
                    </div>
                  </div>
                  {((isFromStudentSystem && displayFeeStructure.feeStructureSnapshot.description) || 
                    (!isFromStudentSystem && displayFeeStructure.description)) && (
                    <div className="mt-3">
                      <Label className={`text-sm font-medium ${isFromStudentSystem ? 'text-green-800' : 'text-blue-800'}`}>Description</Label>
                      <p className={`text-sm p-2 rounded border ${isFromStudentSystem ? 'text-green-900 bg-green-100 border-green-200' : 'text-blue-900 bg-blue-100 border-blue-200'}`}>
                        {isFromStudentSystem ? displayFeeStructure.feeStructureSnapshot.description : displayFeeStructure.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Semester-wise Fee Breakdown */}
            {(() => {
              const displayFeeStructure = propStudentFeeAssignment || currentFeeStructure;
              const semesters = propStudentFeeAssignment 
                ? displayFeeStructure.feeStructureSnapshot.semesters 
                : displayFeeStructure.semesters;
              
              return semesters && semesters.length > 0;
            })() && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Semester-wise Fee Breakdown</h3>
                <div className="space-y-3">
                  {(() => {
                    const displayFeeStructure = propStudentFeeAssignment || currentFeeStructure;
                    const semesters = propStudentFeeAssignment 
                      ? displayFeeStructure.feeStructureSnapshot.semesters 
                      : displayFeeStructure.semesters;
                    
                    return semesters;
                  })().map((semester: any) => {
                    const effectiveFees = getEffectiveFees(semester);
                    const effectiveTotal = getEffectiveTotal(semester);
                    const isCustomized = hasCustomizations(semester);
                    const customizationDetails = getCustomizationDetails(semester);
                    
                    return (
                      <Collapsible
                        key={semester.semester}
                        open={expandedSemesters[semester.semester]}
                        onOpenChange={() => toggleSemesterExpansion(semester.semester)}
                      >
                        <Card className={`border ${isCustomized ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}>
                          <CollapsibleTrigger asChild>
                            <CardHeader className="cursor-pointer hover:bg-gray-50 py-3">
                              <CardTitle className="flex items-center justify-between text-lg">
                                <div className="flex items-center space-x-2">
                                  <span>{semester.semesterName}</span>
                                  {isCustomized && (
                                    <Badge variant="secondary" className="text-xs bg-yellow-200 text-yellow-800">
                                      Customized
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`text-lg font-semibold ${isCustomized ? 'text-orange-600' : 'text-green-600'}`}>
                                    {formatCurrency(effectiveTotal)}
                                  </span>
                                  {canAssign && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditSemester(semester);
                                      }}
                                      className="h-8 px-2"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  )}
                                  {expandedSemesters[semester.semester] ? 
                                    <ChevronUp className="w-4 h-4" /> : 
                                    <ChevronDown className="w-4 h-4" />
                                  }
                                </div>
                              </CardTitle>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="pt-0">
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                  <thead>
                                    <tr className="bg-secondary/10">
                                      <th className="border border-gray-300 p-2 text-left text-sm font-medium">Fee Type</th>
                                      <th className="border border-gray-300 p-2 text-right text-sm font-medium">Original</th>
                                      <th className="border border-gray-300 p-2 text-right text-sm font-medium">Current</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Object.entries(semester.fees).map(([feeType, originalAmount]) => {
                                      const currentAmount = effectiveFees[feeType] || 0;
                                      const isCustomizedFee = originalAmount !== currentAmount;
                                      
                                      return (
                                        <tr key={feeType} className={isCustomizedFee ? "bg-yellow-50" : "hover:bg-gray-50"}>
                                          <td className="border border-gray-300 p-2 text-sm font-medium">
                                            {getFeeTypeLabel(feeType)}
                                          </td>
                                          <td className="border border-gray-300 p-2 text-right text-sm text-gray-600">
                                            {formatCurrency(originalAmount as number)}
                                          </td>
                                          <td className={`border border-gray-300 p-2 text-right text-sm font-medium ${
                                            isCustomizedFee ? 'text-orange-600' : 'text-gray-900'
                                          }`}>
                                            {formatCurrency(currentAmount as number)}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                    <tr className="bg-gray-100 font-semibold">
                                      <td className="border border-gray-300 p-2 text-sm">Total</td>
                                      <td className="border border-gray-300 p-2 text-right text-sm text-gray-600">
                                        {formatCurrency(semester.total)}
                                      </td>
                                      <td className={`border border-gray-300 p-2 text-right text-sm ${
                                        isCustomized ? 'text-orange-600' : 'text-gray-900'
                                      }`}>
                                        {formatCurrency(effectiveTotal)}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                              
                              {/* Customize Fees Button */}
                              <div className="flex justify-end mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditSemester(semester)}
                                  disabled={!studentId} // Only allow customization when using student API
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Customize Fees
                                </Button>
                              </div>
                              
                              {/* Customization History */}
                              {isCustomized && customizationDetails && (
                                <div className="mt-3 p-3 bg-yellow-100 rounded border border-yellow-200">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-yellow-800 mb-1">Customization Details</p>
                                      <p className="text-sm text-yellow-700 mb-2">{customizationDetails.reason}</p>
                                      <div className="flex items-center text-xs text-yellow-600">
                                        <Clock className="w-3 h-3 mr-1" />
                                        <span>Modified by {customizationDetails.customizedBy?.name}</span>
                                        {customizationDetails.customizedAt && (
                                          <span className="ml-2">on {formatDate(customizationDetails.customizedAt)}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Program Information */}
            {programInfo && (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-medium text-gray-900 mb-2">Selected Program Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Program Level</Label>
                    <p className="text-sm text-gray-900">{programInfo.level}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Program Name</Label>
                    <p className="text-sm text-gray-900">{programInfo.name}</p>
                  </div>
                  {programInfo.mode && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Mode</Label>
                      <p className="text-sm text-gray-900">{programInfo.mode}</p>
                    </div>
                  )}
                  {programInfo.specialization && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Specialization</Label>
                      <p className="text-sm text-gray-900">{programInfo.specialization}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* No Assignment State */}
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No fee structure assigned</p>
              <p className="text-sm mt-2">Assign a fee structure to display detailed breakdown</p>
            </div>

            {/* Program Information */}
            {programInfo && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Selected Program Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-blue-800">Program Level</Label>
                    <p className="text-sm text-blue-900">{programInfo.level}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-800">Program Name</Label>
                    <p className="text-sm text-blue-900">{programInfo.name}</p>
                  </div>
                  {programInfo.mode && (
                    <div>
                      <Label className="text-sm font-medium text-blue-800">Mode</Label>
                      <p className="text-sm text-blue-900">{programInfo.mode}</p>
                    </div>
                  )}
                  {programInfo.specialization && (
                    <div>
                      <Label className="text-sm font-medium text-blue-800">Specialization</Label>
                      <p className="text-sm text-blue-900">{programInfo.specialization}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {!canAssign && !currentFeeStructure && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Fee Structure Assignment:</strong> Contact an administrator to assign a fee structure to this application.
            </p>
          </div>
        )}

        {/* Assignment Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="">
            <DialogHeader>
              <DialogTitle>
                {currentFeeStructure ? 'Reassign Fee Structure' : 'Assign Fee Structure'}
              </DialogTitle>
              <DialogDescription>
                Select a fee structure to assign to this application.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Fee Structure</Label>
                <Select 
                  value={selectedFeeStructureId || ''} 
                  onValueChange={(value) => {
                    if (value !== 'no-fee-structures' && value !== 'loading') {
                      setSelectedFeeStructureId(value);
                    }
                  }} 
                  disabled={isLoadingFeeStructures}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingFeeStructures ? "Loading fee structures..." : "Select a fee structure"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingFeeStructures ? (
                      <SelectItem value="loading" disabled>
                        Loading fee structures...
                      </SelectItem>
                    ) : (recommendedFeeStructures && recommendedFeeStructures.length > 0) ? (
                      recommendedFeeStructures
                        .filter((structure) => structure && structure.id && structure.id.trim() !== '')
                        .map((structure) => (
                          <SelectItem key={`fee-${structure.id}`} value={structure.id}>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{structure.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {FEE_STRUCTURE_TYPES[structure.type as FeeStructureType] || structure.type}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500">
                                {structure.academicYear} • {formatCurrency(structure.grandTotal)}
                              </div>
                            </div>
                          </SelectItem>
                        ))
                    ) : (
                      <SelectItem value="no-fee-structures" disabled>
                        No fee structures available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedFeeStructureId && selectedFeeStructureId !== 'no-fee-structures' && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    {(() => {
                      const selected = availableFeeStructures.find(s => s.id === selectedFeeStructureId);
                      return selected ? (
                        <div>
                          <p><strong>Description:</strong> {selected.description || 'No description available'}</p>
                          <p><strong>Semesters:</strong> {selected.semesters.length}</p>
                          <p><strong>Total Fee:</strong> {formatCurrency(selected.grandTotal)}</p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setAssignDialogOpen(false);
                setSelectedFeeStructureId('');
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleAssignFeeStructure} 
                disabled={isLoading || !selectedFeeStructureId || selectedFeeStructureId === 'no-fee-structures' || selectedFeeStructureId === 'loading'}
              >
                {isLoading ? 'Assigning...' : (currentFeeStructure ? 'Reassign' : 'Assign')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Customization Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Customize Semester Fees</DialogTitle>
              <DialogDescription>
                Modify individual fee components for Semester {editingSemester}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(editingFees).map(([feeType, amount]) => (
                  <div key={feeType}>
                    <Label className="text-sm font-medium">{getFeeTypeLabel(feeType)}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={amount.toString()}
                      onChange={(e) => setEditingFees({ 
                        ...editingFees, 
                        [feeType]: parseFloat(e.target.value) || 0 
                      })}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>

              <div>
                <Label className="text-sm font-medium">Reason for Customization *</Label>
                <Textarea
                  placeholder="Explain why these fees are being customized..."
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded border">
                <p className="text-sm font-medium text-gray-700">
                  New Total: {formatCurrency(Object.values(editingFees).reduce((sum, val) => sum + val, 0))}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingSemester(null);
                  setEditingFees({});
                  setEditReason('');
                }}
                disabled={isCustomizing}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateFeeStructure}
                disabled={isCustomizing}
              >
                {isCustomizing ? 'Updating...' : 'Update Fees'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};