'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Edit, Eye, Trash2, DollarSign, RefreshCw } from "lucide-react";
import { FeeStructure, FeeStructureType, FEE_STRUCTURE_TYPES } from "@/types/fee-structure";
import { feeStructureService } from "@/services/feeStructureService";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from "next/link";

export default function FeeStructuresPage() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [filteredStructures, setFilteredStructures] = useState<FeeStructure[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [availableTypes, setAvailableTypes] = useState<Record<string, string>>({});
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });

  // Load initial data
  useEffect(() => {
    loadFeeStructures();
    loadTypes();
    loadAcademicYears();
  }, []);

  // Load fee structures with current filters
  const loadFeeStructures = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page: pagination.currentPage,
        limit: 10
      };

      if (searchTerm) params.search = searchTerm;
      if (typeFilter !== "all") params.type = typeFilter;
      if (academicYearFilter !== "all") params.academicYear = academicYearFilter;

      const response = await feeStructureService.getAll(params);
      setFeeStructures(response.data.feeStructures);
      setFilteredStructures(response.data.feeStructures);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Error loading fee structures:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load fee structures",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load available types
  const loadTypes = async () => {
    try {
      const response = await feeStructureService.getTypes();
      setAvailableTypes(response.data.types);
    } catch (error) {
      console.error('Error loading types:', error);
    }
  };

  // Load available academic years
  const loadAcademicYears = async () => {
    try {
      const response = await feeStructureService.getAcademicYears();
      setAvailableYears(response.data.academicYears);
    } catch (error) {
      console.error('Error loading academic years:', error);
    }
  };

  // Reload data when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      loadFeeStructures();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, typeFilter, academicYearFilter]);

  const canManageFeeStructures = hasPermission('manage_settings');
  const canViewFeeStructures = hasPermission('view_admin_dashboard');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Handle delete fee structure
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee structure? This action cannot be undone.')) {
      return;
    }

    try {
      await feeStructureService.delete(id);
      toast({
        title: "Success",
        description: "Fee structure deleted successfully"
      });
      loadFeeStructures();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete fee structure",
        variant: "destructive"
      });
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    loadFeeStructures();
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredPermissions={['view_admin_dashboard']}>
        <DashboardLayout title="Fee Structures">
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={['view_admin_dashboard']}>
      <DashboardLayout title="Fee Structures">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fee Structures</h1>
              <p className="text-gray-600 mt-2">
                Manage admission fee structures for different batches and quotas
              </p>
              {pagination.totalCount > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Total: {pagination.totalCount} fee structures
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={loadFeeStructures}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {canManageFeeStructures && (
                <Link href="/fee-structures/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Fee Structure
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search fee structures by title or academic year..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Additional Filters */}
          <div className="mb-6 flex gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(availableTypes).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fee Structures List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Fee Structures ({pagination.totalCount || 0})
              </CardTitle>
              <CardDescription>
                All fee structures in the system
                {pagination.totalCount > 0 && (
                  <span className="ml-2">
                    • Showing {((pagination.currentPage - 1) * 10) + 1} to{' '}
                    {Math.min(pagination.currentPage * 10, pagination.totalCount)} of{' '}
                    {pagination.totalCount}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredStructures.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No fee structures found</p>
                  {canManageFeeStructures && (
                    <Link href="/fee-structures/create">
                      <Button className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Fee Structure
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <ScrollArea className="h-[62vh]">
                  <div className="space-y-4">
                    {filteredStructures.map((structure) => (
                      <div
                        key={structure.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{structure.title}</h4>
                            <p className="text-sm text-gray-600">Academic Year: {structure.academicYear}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {availableTypes[structure.type] || structure.type}
                              </Badge>
                              <Badge
                                variant={structure.isActive ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {structure.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                              <span className="font-medium text-primary">Total: {formatCurrency(structure.grandTotal)}</span>
                              <span className="text-purple-600 font-medium">{structure.semesters.length} Semesters</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">
                            Effective: {new Date(structure.effectiveDate).toLocaleDateString()}
                          </p>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/fee-structures/${structure.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {canManageFeeStructures && (
                                <>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/fee-structures/${structure.id}/edit`}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(structure.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              
              {/* Enhanced Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600">
                    Showing {((pagination.currentPage - 1) * 10) + 1} to{' '}
                    {Math.min(pagination.currentPage * 10, pagination.totalCount)} of{' '}
                    {pagination.totalCount} fee structures
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.currentPage === 1}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.totalPages}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.totalPages)}
                      disabled={pagination.currentPage === pagination.totalPages}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}