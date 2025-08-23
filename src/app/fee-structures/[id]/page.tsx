'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, Download, Calendar, DollarSign } from "lucide-react";
import { FeeStructure, FEE_STRUCTURE_TYPES, calculateComponentTotal } from "@/types/fee-structure";
import { feeStructureService } from "@/services/feeStructureService";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

// Mock data - replace with actual API call
const mockFeeStructure: FeeStructure = {
  id: "1",
  type: "regular",
  academicYear: "2025",
  title: "Regular Batch - 2025 Admission",
  description: "Standard fee structure for regular admission batch starting in 2025",
  effectiveDate: new Date("2024-10-12"),
  isActive: true,
  semesters: [
    {
      semester: 1,
      semesterName: "Semester 1 (At the time of admission)",
      fees: {
        managementQuota: {
          admissionFee: 5000,
          examPermitRegFee: 2025,
          specialFee: 2500,
          tuitionFee: 17500,
          others: 0
        },
        governmentQuota: {
          admissionFee: 0,
          examPermitRegFee: 2025,
          specialFee: 2500,
          tuitionFee: 10000,
          others: 0
        }
      },
      total: { managementQuota: 27025, governmentQuota: 14525 }
    },
    {
      semester: 2,
      semesterName: "Semester 2",
      fees: {
        managementQuota: {
          admissionFee: 0,
          examPermitRegFee: 0,
          specialFee: 0,
          tuitionFee: 20000,
          others: 0
        },
        governmentQuota: {
          admissionFee: 0,
          examPermitRegFee: 0,
          specialFee: 0,
          tuitionFee: 12500,
          others: 0
        }
      },
      total: { managementQuota: 20000, governmentQuota: 12500 }
    }
  ],
  grandTotal: { managementQuota: 127025, governmentQuota: 77025 },
  hostelFee: 6000,
  createdAt: new Date("2024-10-10"),
  updatedAt: new Date("2024-10-12"),
  createdBy: "admin"
};

export default function ViewFeeStructurePage() {
  const params = useParams();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [feeStructure, setFeeStructure] = useState<FeeStructure | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canManageFeeStructures = hasPermission('manage_settings');
  const canViewFeeStructures = hasPermission('view_admin_dashboard');

  useEffect(() => {
    const fetchFeeStructure = async () => {
      setIsLoading(true);
      try {
        const response = await feeStructureService.getById(params.id as string);
        setFeeStructure(response.data.feeStructure);
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
      <ProtectedRoute requiredPermissions={['view_admin_dashboard']}>
        <DashboardLayout title="Fee Structure Details">
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!feeStructure) {
    return (
      <ProtectedRoute requiredPermissions={['view_admin_dashboard']}>
        <DashboardLayout title="Fee Structure Details">
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-500">Fee structure not found.</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const exportToCSV = () => {
    // Export semester-based structure
    const headers = [
      'Semester',
      'Admission Fee',
      'Exam/Permit Fee', 
      'Special Fee',
      'Tuition Fee',
      'Fee/Fund Charges',
      'Others',
      'Total'
    ];

    const rows = feeStructure.semesters.map(semester => [
      semester.semesterName,
      semester.fees.admissionFee,
      semester.fees.examPermitRegFee,
      semester.fees.specialFee,
      semester.fees.tuitionFee,
      semester.fees.others,
      calculateComponentTotal(semester.fees)
    ]);

    // Add grand total row
    rows.push([
      'Grand Total',
      '',
      '',
      '',
      '',
      '',
      '',
      feeStructure.grandTotal
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${feeStructure.title.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute requiredPermissions={['view_admin_dashboard']}>
      <DashboardLayout title="Fee Structure Details">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/fee-structures">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Fee Structures
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{feeStructure.title}</h1>
                <p className="text-gray-600 mt-2">
                  {feeStructure.description || 'Fee structure details'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              {canManageFeeStructures && (
                <Link href={`/fee-structures/${feeStructure.id}/edit`}>
                  <Button>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Structure
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Structure Type</CardTitle>
            <Badge variant="outline">
              {FEE_STRUCTURE_TYPES[feeStructure.type]}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feeStructure.academicYear}</div>
            <p className="text-xs text-muted-foreground">Academic Year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Badge variant={feeStructure.isActive ? "default" : "secondary"}>
              {feeStructure.isActive ? "Active" : "Inactive"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {new Date(feeStructure.effectiveDate).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">Effective Date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hostel Fee</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(feeStructure.hostelFee || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Per Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Semester Fee Structure */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Breakdown by Semester</CardTitle>
          <CardDescription>
            Detailed fee structure for each semester
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Semester</TableHead>
                  <TableHead className="text-center">Admission Fee</TableHead>
                  <TableHead className="text-center">Exam/Permit Reg Fee</TableHead>
                  <TableHead className="text-center">Special Fee</TableHead>
                  <TableHead className="text-center">Tuition Fee</TableHead>
                  <TableHead className="text-center">Others</TableHead>
                  <TableHead className="text-center font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeStructure.semesters.map((semester, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {semester.semesterName}
                    </TableCell>
                    <TableCell className="font-mono text-center">
                      {semester.fees.admissionFee.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-center">
                      {semester.fees.examPermitRegFee.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-center">
                      {semester.fees.specialFee.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-center">
                      {semester.fees.tuitionFee.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-center">
                      {semester.fees.others.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-center bg-blue-50">
                      {calculateComponentTotal(semester.fees).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell>Grand Total</TableCell>
                  <TableCell colSpan={6}></TableCell>
                  <TableCell className="text-lg text-center">
                    {feeStructure.grandTotal.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary text-center">Total Fee Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">
              {formatCurrency(feeStructure.grandTotal)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Total fee for this structure
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Created:</span> {new Date(feeStructure.createdAt).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Last Updated:</span> {new Date(feeStructure.updatedAt).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Created by:</span> {typeof feeStructure.createdBy === 'object' ? feeStructure.createdBy.name || feeStructure.createdBy.email : feeStructure.createdBy}
          </div>
          <div>
            <span className="font-medium">Hostel Fee/month:</span> {formatCurrency(feeStructure.hostelFee || 0)}
          </div>
          </CardContent>
        </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}