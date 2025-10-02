'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { 
  FeeStructure,
  UpdateFeeStructureData, 
  FeeStructureType, 
  FEE_STRUCTURE_TYPES,
  FeeComponent,
  calculateComponentTotal,
  calculateGrandTotal
} from "@/types/fee-structure";
import { feeStructureService } from "@/services/feeStructureService";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";


export default function EditFeeStructurePage() {
  const router = useRouter();
  const params = useParams();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [feeStructure, setFeeStructure] = useState<any | null>(null);

  const [formData, setFormData] = useState<UpdateFeeStructureData>({
    id: '',
    type: 'regular',
    academicYear: '',
    title: '',
    description: '',
    effectiveDate: new Date(),
    isActive: true,
    semesters: []
  });

  const canManageFeeStructures = hasPermission('manage_settings');

  useEffect(() => {
    const fetchFeeStructure = async () => {
      setIsLoading(true);
      try {
        const response = await feeStructureService.getById(params.id as string);
        const data = response.data.feeStructure;
        
        setFeeStructure(data);
        setFormData({
          id: data.id,
          type: data.type,
          academicYear: data.academicYear,
          title: data.title,
          description: data.description || '',
          effectiveDate: new Date(data.effectiveDate),
          isActive: data.isActive,
          semesters: data.semesters
        });
      } catch (error: any) {
        console.error('Error fetching fee structure:', error);
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to load fee structure",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchFeeStructure();
    }
  }, [params.id, toast]);

  if (isLoading) {
    return (
      <ProtectedRoute requiredPermissions={['manage_settings']}>
        <DashboardLayout title="Edit Fee Structure">
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!feeStructure) {
    return (
      <ProtectedRoute requiredPermissions={['manage_settings']}>
        <DashboardLayout title="Edit Fee Structure">
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-500">Fee structure not found.</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Direct fee update function for simplified structure (removed - not needed)

  // Semester fee update function
  const updateSemesterFee = (
    semesterIndex: number,
    field: keyof FeeComponent, 
    value: number
  ) => {
    setFormData(prev => ({
      ...prev,
      semesters: prev.semesters?.map((semester, index) => 
        index === semesterIndex 
          ? {
              ...semester,
              fees: {
                ...semester.fees,
                [field]: value
              }
            }
          : semester
      ) || []
    }));
  };

  const addSemester = () => {
    const newSemesterNumber = (formData.semesters?.length || 0) + 1;
    const defaultFeeComponent: FeeComponent = {
      admissionFee: 0,
      examPermitRegFee: 0,
      specialFee: 0,
      tuitionFee: 0,
      others: 0
    };

    setFormData((prev:any) => ({
      ...prev,
      semesters: [
        ...(prev.semesters || []),
        {
          semester: newSemesterNumber,
          semesterName: `Semester ${newSemesterNumber}`,
          fees: {
            managementQuota: { ...defaultFeeComponent },
            governmentQuota: { ...defaultFeeComponent }
          },
          total: { managementQuota: 0, governmentQuota: 0 }
        }
      ]
    }));
  };

  const removeSemester = (index: number) => {
    if ((formData.semesters?.length || 0) > 1) {
      setFormData(prev => ({
        ...prev,
        semesters: prev.semesters?.filter((_, i) => i !== index) || []
      }));
    }
  };

  const calculateTotals = () => {
    // For semester-based structure
    if (formData.semesters && formData.semesters.length > 0) {
      const semestersWithTotals = formData.semesters.map(semester => ({
        ...semester,
        total: calculateComponentTotal(semester.fees)
      }));

      return calculateGrandTotal(semestersWithTotals);
    }

    return 0;
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
      await feeStructureService.update(formData.id, formData);
      
      toast({
        title: "Success",
        description: "Fee structure updated successfully"
      });
      
      router.push('/fee-structures');
    } catch (error: any) {
      console.error('Error updating fee structure:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update fee structure",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <ProtectedRoute requiredPermissions={['manage_settings']}>
      <DashboardLayout title="Edit Fee Structure">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/fee-structures">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Fee Structures
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Fee Structure</h1>
              <p className="text-gray-600 mt-2">
                Modify the existing fee structure
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update the basic details of the fee structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Fee Structure Type</Label>
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

              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Input
                  id="academicYear"
                  value={formData.academicYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                  placeholder="2025"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Regular Batch - 2025 Admission"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details about this fee structure..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Effective Date</Label>
                <DatePicker
                  date={formData.effectiveDate}
                  setDate={(date:any) => date && setFormData(prev => ({ ...prev, effectiveDate: date }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive" className="text-sm">
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Semester Fee Structure */}
        <Card>
          <CardHeader>
            <CardTitle>Semester Fee Structure</CardTitle>
            <CardDescription>
              Update fees for each semester
            </CardDescription>
          </CardHeader>
            <CardContent className="space-y-6">
              {formData.semesters?.map((semester, semesterIndex) => (
                <div key={semesterIndex} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{semester.semesterName}</h4>
                    {(formData.semesters?.length || 0) > 1 && (
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm">Admission Fee</Label>
                      <Input
                        type="number"
                        value={semester.fees?.admissionFee || 0}
                        onChange={(e) => updateSemesterFee(semesterIndex, 'admissionFee', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Exam/Permit Reg Fee</Label>
                      <Input
                        type="number"
                        value={semester.fees?.examPermitRegFee || 0}
                        onChange={(e) => updateSemesterFee(semesterIndex, 'examPermitRegFee', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Special Fee</Label>
                      <Input
                        type="number"
                        value={semester.fees?.specialFee || 0}
                        onChange={(e) => updateSemesterFee(semesterIndex, 'specialFee', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Tuition Fee</Label>
                      <Input
                        type="number"
                        value={semester.fees?.tuitionFee || 0}
                        onChange={(e) => updateSemesterFee(semesterIndex, 'tuitionFee', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Others</Label>
                      <Input
                        type="number"
                        value={semester.fees?.others || 0}
                        onChange={(e) => updateSemesterFee(semesterIndex, 'others', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-medium p-2 bg-blue-50 rounded">
                    Semester Total: {formatCurrency(semester.fees ? calculateComponentTotal(semester.fees) : 0)}
                  </div>
                </div>
              )) || []}

              <Button
                type="button"
                variant="outline"
                onClick={addSemester}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Semester
              </Button>
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

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Updating...' : 'Update Fee Structure'}
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