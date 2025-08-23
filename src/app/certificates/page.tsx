'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download, 
  Eye, 
  Search,
  Filter,
  Calendar,
  Users,
  Award
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { get, put, post, downloadFile } from '@/utilities/AxiosInterceptor';
import { toast } from '@/components/ui/use-toast';

interface CertificateRequest {
  id: string;
  studentId: {
    name: string;
    email: string;
    admissionNumber: string;
    department: string;
  };
  certificateType: string;
  purpose: string;
  status: string;
  requestDate: string;
  processedDate?: string;
  processedBy?: {
    name: string;
    email: string;
  };
  priorityLevel: string;
  deliveryMethod: string;
  academicYear: string;
  currentYear: string;
  currentSemester: string;
  rejectionReason?: string;
  remarks?: string;
  serialNumber?: string;
}

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
  approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
  generated: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Generated' },
  delivered: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, label: 'Delivered' }
};

const certificateTypeLabels = {
  bonafide: 'Bonafide Certificate',
  fee_certificate: 'Fee Certificate',
  medium_of_instruction: 'Medium of Instruction Certificate',
  letter_of_recommendation: 'Letter of Recommendation',
  course_conduct_certificate: 'Course and Conduct Certificate',
  conduct_certificate: 'Conduct Certificate',
  transfer_certificate: 'Transfer Certificate'
};

export default function AdminCertificatesPage() {
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<CertificateRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: '',
    rejectionReason: '',
    remarks: ''
  });

  useEffect(() => {
    fetchCertificateRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter, typeFilter, departmentFilter]);

  const fetchCertificateRequests = async () => {
    try {
      const response = await get<{ success: boolean; data: CertificateRequest[] }>('/api/v1/certificates/all');
      if (response.success) {
        setRequests(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch certificate requests:', error);
      toast({
        title: "Error",
        description: "Failed to load certificate requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.studentId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.studentId.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.studentId.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(request => request.certificateType === typeFilter);
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(request => request.studentId.department === departmentFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleStatusUpdate = async () => {
    if (!selectedRequest) return;

    try {
      const response = await put(`/api/v1/certificates/${selectedRequest.id}/status`, statusForm);
      if (response.success) {
        toast({
          title: "Success",
          description: `Certificate request ${statusForm.status} successfully`,
        });
        setShowStatusDialog(false);
        fetchCertificateRequests();
      }
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update certificate status",
        variant: "destructive",
      });
    }
  };

  const handleGenerateCertificate = async (request: CertificateRequest) => {
    try {
      const response = await post(`/api/v1/certificates/${request.id}/generate`);
      if (response.success) {
        toast({
          title: "Success",
          description: "Certificate marked as ready for download",
        });
        fetchCertificateRequests();
      }
    } catch (error: any) {
      console.error('Failed to generate certificate:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to generate certificate",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (request: CertificateRequest) => {
    try {
      const certificateTypes = {
        bonafide: 'Bonafide_Certificate',
        fee_certificate: 'Fee_Certificate',
        medium_of_instruction: 'Medium_of_Instruction_Certificate',
        letter_of_recommendation: 'Letter_of_Recommendation',
        course_conduct_certificate: 'Course_and_Conduct_Certificate',
        conduct_certificate: 'Conduct_Certificate',
        transfer_certificate: 'Transfer_Certificate'
      };
      
      const filename = `${certificateTypes[request.certificateType as keyof typeof certificateTypes] || request.certificateType}_${request.studentId.admissionNumber}.pdf`;
      
      await downloadFile(`/api/v1/certificates/download/${request.id}`, filename);
      
      toast({
        title: "Success",
        description: "Certificate downloaded successfully",
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Error",
        description: "Failed to download certificate",
        variant: "destructive",
      });
    }
  };

  const openStatusDialog = (request: CertificateRequest, status: string) => {
    setSelectedRequest(request);
    setStatusForm({
      status,
      rejectionReason: '',
      remarks: request.remarks || ''
    });
    setShowStatusDialog(true);
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    generated: requests.filter(r => r.status === 'generated').length,
  };

  if (loading) {
    return (
      <DashboardLayout title="Certificate Management">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Certificate Management">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Requests</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Approved</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Generated</p>
                  <p className="text-2xl font-bold">{stats.generated}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by student name, admission number, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="generated">Generated</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="bonafide">Bonafide</SelectItem>
                    <SelectItem value="fee_certificate">Fee Certificate</SelectItem>
                    <SelectItem value="medium_of_instruction">Medium of Instruction</SelectItem>
                    <SelectItem value="letter_of_recommendation">Letter of Recommendation</SelectItem>
                    <SelectItem value="course_conduct_certificate">Course and Conduct</SelectItem>
                    <SelectItem value="conduct_certificate">Conduct</SelectItem>
                    <SelectItem value="transfer_certificate">Transfer</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-50">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                    <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                    <SelectItem value="Electrical and Electronics Engineering">EEE</SelectItem>
                    <SelectItem value="Computer Engineering">Computer Engineering</SelectItem>
                    <SelectItem value="Automobile Engineering">Automobile Engineering</SelectItem>
                    <SelectItem value="Architecture">Architecture</SelectItem>
                    <SelectItem value="MBA">MBA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Certificate Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Certificate Type</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => {
                  const statusInfo = statusConfig[request.status as keyof typeof statusConfig];
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.studentId.name}</p>
                          <p className="text-sm text-gray-500">{request.studentId.admissionNumber}</p>
                          <p className="text-xs text-gray-400">{request.studentId.department}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {certificateTypeLabels[request.certificateType as keyof typeof certificateTypeLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-48">
                        <p className="truncate">{request.purpose}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={request.priorityLevel === 'urgent' ? 'destructive' : 'secondary'}>
                          {request.priorityLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(request.requestDate).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openStatusDialog(request, 'approved')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openStatusDialog(request, 'rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          
                          {request.status === 'approved' && (
                            <Button
                              size="sm"
                              onClick={() => handleGenerateCertificate(request)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Mark Ready
                            </Button>
                          )}
                          
                          {request.status === 'generated' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(request)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Status Update Dialog */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {statusForm.status === 'approved' ? 'Approve' : 'Reject'} Certificate Request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {statusForm.status === 'rejected' && (
                <div>
                  <Label htmlFor="rejectionReason">Rejection Reason</Label>
                  <Textarea
                    id="rejectionReason"
                    value={statusForm.rejectionReason}
                    onChange={(e) => setStatusForm(prev => ({ ...prev, rejectionReason: e.target.value }))}
                    placeholder="Please provide a reason for rejection..."
                    rows={3}
                    required
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  value={statusForm.remarks}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Additional comments..."
                  rows={2}
                />
              </div>
              
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleStatusUpdate}
                  className={statusForm.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                  variant={statusForm.status === 'rejected' ? 'destructive' : 'default'}
                >
                  {statusForm.status === 'approved' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Request Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Certificate Request Details</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-6">
                {/* Similar detailed view as student portal but with admin actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Student Name</Label>
                    <p className="font-semibold">{selectedRequest.studentId.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Admission Number</Label>
                    <p className="font-semibold">{selectedRequest.studentId.admissionNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Department</Label>
                    <p className="font-semibold">{selectedRequest.studentId.department}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="font-semibold">{selectedRequest.studentId.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Certificate Type</Label>
                    <p className="font-semibold">
                      {certificateTypeLabels[selectedRequest.certificateType as keyof typeof certificateTypeLabels]}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Purpose</Label>
                    <p className="font-semibold">{selectedRequest.purpose}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Priority</Label>
                    <p className="font-semibold capitalize">{selectedRequest.priorityLevel}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}