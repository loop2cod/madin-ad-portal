'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { 
  CreateFeeStructureData, 
  FeeStructureType, 
  FEE_STRUCTURE_TYPES, 
  FeeComponent,
  calculateComponentTotal,
  calculateGrandTotal
} from "@/types/fee-structure";
import { feeStructureService } from "@/services/feeStructureService";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

const defaultFeeComponent: FeeComponent = {
  admissionFee: 0,
  examPermitRegFee: 0,
  specialFee: 0,
  tuitionFee: 0,
  others: 0
};

export default function CreateFeeStructurePage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<CreateFeeStructureData>({
    type: 'regular',
    academicYear: new Date().getFullYear().toString(),
    title: '',
    description: '',
    effectiveDate: new Date(),
    semesters: [
      {
        semester: 1,
        semesterName: 'Semester 1',
        fees: { ...defaultFeeComponent }
      }
    ]
  });


  const updateSemesterFee = (
    semesterIndex: number,
    field: keyof FeeComponent, 
    value: number
  ) => {
    setFormData(prev => ({
      ...prev,
      semesters: prev.semesters.map((semester, index) => 
        index === semesterIndex 
          ? {
              ...semester,
              fees: {
                ...semester.fees,
                [field]: value
              }
            }
          : semester
      )
    }));
  };

  const addSemester = () => {
    const newSemesterNumber = formData.semesters.length + 1;
    setFormData(prev => ({
      ...prev,
      semesters: [
        ...prev.semesters,
        {
          semester: newSemesterNumber,
          semesterName: `Semester ${newSemesterNumber}`,
          fees: { ...defaultFeeComponent }
        }
      ]
    }));
  };

  const removeSemester = (index: number) => {
    if (formData.semesters.length > 1) {
      setFormData(prev => ({
        ...prev,
        semesters: prev.semesters.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateTotals = () => {
    const semestersWithTotals = formData.semesters.map(semester => ({
      ...semester,
      total: calculateComponentTotal(semester.fees)
    }));
    
    return calculateGrandTotal(semestersWithTotals);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await feeStructureService.create(formData);
      
      toast({
        title: "Success",
        description: "Fee structure created successfully"
      });
      
      router.push('/fee-structures');
    } catch (error: any) {
      console.error('Error creating fee structure:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create fee structure",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <ProtectedRoute requiredPermissions={['manage_settings']}>
      <DashboardLayout title="Create Fee Structure">
        <div className="max-w-6xl mx-auto p-2 md:p-6">
          <div className="md:flex md:justify-between  items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Fee Structure</h1>
              <p className="text-gray-600 mt-2">
                Set up a new fee structure for admission
              </p>
            </div>
             <Link href="/fee-structures">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Fee Structures
              </Button>
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Configure the basic details of the fee structure
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-2'>
                {/* Two Column Layout for Type and Academic Year */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium">Fee Structure Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: FeeStructureType) => 
                        setFormData(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FEE_STRUCTURE_TYPES).map(([key, label]:any) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="academicYear" className="text-sm font-medium">Academic Year</Label>
                    <Input
                      id="academicYear"
                      value={formData.academicYear}
                      onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                      placeholder="2025"
                      required
                    />
                  </div>
                </div>

                {/* Full Width Title */}
                <div className="space-y-1">
                  <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Regular Batch - 2025 Admission"
                    required
                  />
                </div>

                {/* Two Column Layout for Description and Date */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      className="resize-none min-h-[100px]"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Additional details about this fee structure..."
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Effective Date</Label>
                    <div className="w-full">
                      <DatePicker
                        date={formData.effectiveDate}
                        setDate={(date:any) => date && setFormData(prev => ({ ...prev, effectiveDate: date }))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Semester Fee Structure</CardTitle>
                    <CardDescription>
                      Configure fees for each semester
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSemester}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Semester
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {formData.semesters.map((semester, semesterIndex) => (
                  <div key={semesterIndex} className="border rounded-lg p-2 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">{semester.semesterName}</h4>
                      {formData.semesters.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSemester(semesterIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <Label className="text-sm">Admission Fee</Label>
                        <Input
                          type="number"
                          value={semester.fees.admissionFee || ''}
                          onChange={(e) => updateSemesterFee(semesterIndex, 'admissionFee', Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Exam/Permit Reg Fee</Label>
                        <Input
                          type="number"
                          value={semester.fees.examPermitRegFee || ''}
                          onChange={(e) => updateSemesterFee(semesterIndex, 'examPermitRegFee', Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Special Fee</Label>
                        <Input
                          type="number"
                          value={semester.fees.specialFee || ''}
                          onChange={(e) => updateSemesterFee(semesterIndex, 'specialFee', Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Tuition Fee</Label>
                        <Input
                          type="number"
                          value={semester.fees.tuitionFee || ''}
                          onChange={(e) => updateSemesterFee(semesterIndex, 'tuitionFee', Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Others</Label>
                        <Input
                          type="number"
                          value={semester.fees.others || ''}
                          onChange={(e) => updateSemesterFee(semesterIndex, 'others', Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                    <div className="text-sm font-medium p-3 bg-blue-50 rounded border border-blue-200">
                      Semester Total: {formatCurrency(calculateComponentTotal(semester.fees))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="font-medium text-gray-600">Total Fee Structure</div>
                  <div className="text-3xl font-bold text-primary mt-2">
                    {formatCurrency(totals)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Creating...' : 'Create Fee Structure'}
              </Button>
              <Link href="/fee-structures">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}