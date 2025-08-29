import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { get, post, patch } from '@/utilities/AxiosInterceptor';
import {
  CreditCard,
  Plus,
  Edit,
  ChevronDown,
  ChevronUp
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
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface FeeStructure {
  id: string;
  title: string;
  type: string;
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
      others: number;
    };
    total: number;
  }>;
  grandTotal: number;
  hostelFee: number;
  effectiveDate: string;
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
  feeStructureSnapshot: FeeStructure;
  customizations: Array<{
    semester: number;
    fees: {
      admissionFee?: number;
      examPermitRegFee?: number;
      specialFee?: number;
      tuitionFee?: number;
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

interface StudentFeeManagementProps {
  studentId: string;
  feeAssignment: FeeAssignment | null;
  onFeeAssignmentUpdate: (assignment: FeeAssignment) => void;
}

export const StudentFeeManagement: React.FC<StudentFeeManagementProps> = ({
  studentId,
  feeAssignment,
  onFeeAssignmentUpdate
}) => {
  // All hooks must be declared at the top before any early returns
  const [availableFeeStructures, setAvailableFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [editingSemester, setEditingSemester] = useState<number | null>(null);
  const [editingFees, setEditingFees] = useState<{[key: string]: number}>({});
  const [editReason, setEditReason] = useState('');
  const [expandedSemesters, setExpandedSemesters] = useState<{ [key: number]: boolean }>({});
  const { toast } = useToast();

  // useEffect hook must be declared before any conditional returns
  useEffect(() => {
    if (studentId && studentId !== 'undefined') {
      fetchAvailableFeeStructures();
    }
  }, [studentId]);

  // Debug logging
  console.log('StudentFeeManagement render:', { studentId, feeAssignment: !!feeAssignment });

  // Early return if studentId is invalid
  if (!studentId || studentId === 'undefined') {
    console.log('StudentFeeManagement: Invalid studentId, showing error state');
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Fee Structure Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Invalid student ID: &quot;{studentId}&quot;. Cannot load fee management.</p>
            <p className="text-xs mt-2">Debug: Check if student data is loaded properly</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const fetchAvailableFeeStructures = async () => {
    try {
      setLoading(true);
      const response = await get<any>('/api/v1/admin/fee-structures/active');
      if (response.success) {
        setAvailableFeeStructures(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch fee structures:', error);
      toast({
        title: "Error",
        description: "Failed to fetch available fee structures",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignFeeStructure = async () => {
    if (!studentId || studentId === 'undefined') {
      toast({
        title: "Error",
        description: "Invalid student ID",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFeeStructure || selectedFeeStructure === 'no-structures') {
      toast({
        title: "Error",
        description: "Please select a valid fee structure",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Assigning fee structure:', selectedFeeStructure, 'to student:', studentId);
      const response = await post<any>(`/api/v1/admin/students/${studentId}/assign-fee-structure`, {
        feeStructureId: selectedFeeStructure,
        notes: assignmentNotes
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Fee structure assigned successfully",
        });
        onFeeAssignmentUpdate(response.data);
        setAssignDialogOpen(false);
        setSelectedFeeStructure('');
        setAssignmentNotes('');
      } else {
        throw new Error(response.message || 'Failed to assign fee structure');
      }
    } catch (error: any) {
      console.error('Failed to assign fee structure:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to assign fee structure",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeeStructure = async () => {
    if (editingSemester === null || !editingFees) {
      return;
    }

    try {
      setLoading(true);
      const response = await patch<any>(`/api/v1/admin/students/${studentId}/update-fee-structure`, {
        semester: editingSemester,
        feeCustomizations: editingFees,
        reason: editReason
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Fee structure customization updated successfully",
        });
        onFeeAssignmentUpdate(response.data);
        setEditDialogOpen(false);
        setEditingSemester(null);
        setEditingFees({});
        setEditReason('');
      }
    } catch (error: any) {
      console.error('Failed to update fee structure:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update fee structure",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditingSemester = (semester: number, currentFees: any) => {
    setEditingSemester(semester);
    setEditingFees({ ...currentFees });
    setEditReason('');
    setEditDialogOpen(true);
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

  const getEffectiveFees = (semester: any) => {
    if (!feeAssignment) return semester.fees;
    
    const customization = feeAssignment.customizations?.find(c => c.semester === semester.semester);
    if (!customization) return semester.fees;

    const effectiveFees = { ...semester.fees };
    Object.keys(customization.fees).forEach(feeType => {
      if (customization.fees[feeType as keyof typeof customization.fees] !== undefined) {
        effectiveFees[feeType as keyof typeof effectiveFees] = customization.fees[feeType as keyof typeof customization.fees]!;
      }
    });

    return effectiveFees;
  };

  const calculateEffectiveTotal = (semester: any) => {
    const effectiveFees = getEffectiveFees(semester);
    return effectiveFees.admissionFee + 
           effectiveFees.examPermitRegFee + 
           effectiveFees.specialFee + 
           effectiveFees.tuitionFee + 
           effectiveFees.others;
  };

  const hasCustomizations = (semester: number) => {
    return feeAssignment?.customizations?.some(c => c.semester === semester) || false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Fee Structure Management
          </div>
          <Button
            onClick={() => setAssignDialogOpen(true)}
            size="sm"
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-2" />
            {feeAssignment ? 'Reassign' : 'Assign'} Fee Structure
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {feeAssignment ? (
          <>
            {/* Current Assignment Info */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">Currently Assigned Fee Structure</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-blue-800">Title</Label>
                  <p className="text-sm text-blue-900">{feeAssignment.feeStructure.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-blue-800">Type</Label>
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                    {feeAssignment.feeStructure.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-blue-800">Academic Year</Label>
                  <p className="text-sm text-blue-900">{feeAssignment.feeStructure.academicYear}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-blue-800">Assigned By</Label>
                  <p className="text-sm text-blue-900">{feeAssignment.assignedBy.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-blue-800">Assigned Date</Label>
                  <p className="text-sm text-blue-900">{format(new Date(feeAssignment.assignedAt), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-blue-800">Grand Total</Label>
                  <p className="text-sm font-semibold text-blue-900">
                    ₹{feeAssignment.feeStructureSnapshot.semesters.reduce((total, sem) => total + calculateEffectiveTotal(sem), 0).toLocaleString()}
                  </p>
                </div>
              </div>
              {feeAssignment.notes && (
                <div className="mt-3">
                  <Label className="text-sm font-medium text-blue-800">Notes</Label>
                  <p className="text-sm text-blue-900 bg-blue-100 p-2 rounded border">
                    {feeAssignment.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Semester-wise Fee Breakdown */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Semester-wise Fee Breakdown</h3>
              <div className="space-y-3">
                {feeAssignment.feeStructureSnapshot.semesters.map((semester) => (
                  <Collapsible
                    key={semester.semester}
                    open={expandedSemesters[semester.semester]}
                    onOpenChange={() => toggleSemesterExpansion(semester.semester)}
                  >
                    <Card className="border border-gray-200">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 py-3">
                          <CardTitle className="flex items-center justify-between text-lg">
                            <div className="flex items-center space-x-2">
                              <span>{semester.semesterName}</span>
                              {hasCustomizations(semester.semester) && (
                                <Badge variant="secondary" className="text-xs">
                                  Customized
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-semibold text-green-600">
                                ₹{calculateEffectiveTotal(semester).toLocaleString()}
                              </span>
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
                                  const effectiveFees = getEffectiveFees(semester);
                                  const currentAmount = effectiveFees[feeType as keyof typeof effectiveFees];
                                  const isCustomized = originalAmount !== currentAmount;
                                  
                                  return (
                                    <tr key={feeType} className={isCustomized ? "bg-yellow-50" : "hover:bg-gray-50"}>
                                      <td className="border border-gray-300 p-2 text-sm font-medium">
                                        {getFeeTypeLabel(feeType)}
                                      </td>
                                      <td className="border border-gray-300 p-2 text-right text-sm">
                                        ₹{originalAmount.toLocaleString()}
                                      </td>
                                      <td className="border border-gray-300 p-2 text-right text-sm font-medium">
                                        <span className={isCustomized ? "text-orange-600" : ""}>
                                          ₹{currentAmount.toLocaleString()}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                                <tr className="bg-gray-100 font-semibold">
                                  <td className="border border-gray-300 p-2 text-sm">Total</td>
                                  <td className="border border-gray-300 p-2 text-right text-sm">
                                    ₹{semester.total.toLocaleString()}
                                  </td>
                                  <td className="border border-gray-300 p-2 text-right text-sm">
                                    ₹{calculateEffectiveTotal(semester).toLocaleString()}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          
                          <div className="flex justify-end mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditingSemester(semester.semester, getEffectiveFees(semester))}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Customize Fees
                            </Button>
                          </div>

                          {/* Show customization history */}
                          {feeAssignment.customizations?.filter(c => c.semester === semester.semester).map((customization, index) => (
                            <div key={index} className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-medium text-yellow-800">
                                    Customized by {customization.customizedBy.name}
                                  </p>
                                  <p className="text-xs text-yellow-700">
                                    {format(new Date(customization.customizedAt), 'dd/MM/yyyy hh:mm a')}
                                  </p>
                                </div>
                              </div>
                              {customization.reason && (
                                <p className="text-sm text-yellow-800 mt-2">
                                  <strong>Reason:</strong> {customization.reason}
                                </p>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No fee structure assigned</p>
            <p className="text-sm mt-2">Click &quot;Assign Fee Structure&quot; to assign a fee structure to this student</p>
          </div>
        )}

        {/* Assign Fee Structure Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="">
            <DialogHeader>
              <DialogTitle>
                {feeAssignment ? 'Reassign Fee Structure' : 'Assign Fee Structure'}
              </DialogTitle>
              <DialogDescription>
                Select a fee structure to assign to this student.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Fee Structure</Label>
                {/* Debug info - remove in production */}
                <div className="text-xs text-gray-500 mb-1 p-2 bg-gray-100 rounded">
                  <div>Student ID: &quot;{studentId}&quot; | Available: {availableFeeStructures.length} fee structures | Selected: &quot;{selectedFeeStructure}&quot;</div>
                </div>
                <Select 
                  value={selectedFeeStructure || ''} 
                  onValueChange={(value) => {
                    console.log('Fee structure selected:', value);
                    
                    // Handle undefined or invalid values
                    if (value === undefined || value === null || value === '') {
                      console.log('Invalid value received, ignoring');
                      return;
                    }
                    
                    if (value !== 'no-structures' && value !== 'loading') {
                      setSelectedFeeStructure(value);
                      console.log('Fee structure set to:', value);
                    }
                  }} 
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading fee structures..." : "Select a fee structure"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loading ? (
                      <SelectItem value="loading" disabled>
                        Loading fee structures...
                      </SelectItem>
                    ) : (availableFeeStructures && availableFeeStructures.length > 0) ? (
                      availableFeeStructures
                        .filter((structure) => {
                          return structure && structure.id && structure.id.trim() !== '';
                        })
                        .map((structure) => (
                          <SelectItem key={`fee-${structure.id}`} value={structure.id}>
                            {structure.title} - {structure.type.replace('_', ' ').toUpperCase()} ({structure.academicYear}) - ₹{structure.grandTotal.toLocaleString()}
                          </SelectItem>
                        ))
                    ) : (
                      <SelectItem value="no-structures" disabled>
                        No fee structures available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {availableFeeStructures.length === 0 && !loading && (
                  <div className="mt-2 text-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchAvailableFeeStructures}
                      disabled={loading}
                    >
                      Retry Loading
                    </Button>
                  </div>
                )}
                {availableFeeStructures.length > 0 && selectedFeeStructure && selectedFeeStructure !== 'no-structures' && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    {(() => {
                      const selected = availableFeeStructures.find(s => s.id === selectedFeeStructure);
                      return selected ? (
                        <div>
                          <p><strong>Description:</strong> {selected.description || 'No description available'}</p>
                          <p><strong>Semesters:</strong> {selected.semesters.length}</p>
                          <p><strong>Total Fee:</strong> ₹{selected.grandTotal.toLocaleString()}</p>
                          {selected.hostelFee > 0 && <p><strong>Hostel Fee:</strong> ₹{selected.hostelFee.toLocaleString()}</p>}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any notes about this assignment..."
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setAssignDialogOpen(false);
                setSelectedFeeStructure('');
                setAssignmentNotes('');
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleAssignFeeStructure} 
                disabled={loading || !selectedFeeStructure || selectedFeeStructure === 'no-structures' || selectedFeeStructure === 'loading'}
              >
                {loading ? 'Assigning...' : (feeAssignment ? 'Reassign' : 'Assign')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Fee Structure Dialog */}
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
                    />
                  </div>
                ))}
              </div>

              <div>
                <Label className="text-sm font-medium">Reason for Customization</Label>
                <Textarea
                  placeholder="Explain why these fees are being customized..."
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="p-3 bg-gray-50 rounded border">
                <p className="text-sm font-medium text-gray-700">
                  New Total: ₹{Object.values(editingFees).reduce((sum: number, val: number) => sum + val, 0).toLocaleString()}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateFeeStructure} disabled={loading}>
                {loading ? 'Updating...' : 'Update Fees'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};