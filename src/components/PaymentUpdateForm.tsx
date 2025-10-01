'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { put } from '@/utilities/AxiosInterceptor';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, Edit3, Save, X, Check } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentDetails {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  receipt: string;
  attempts?: number;
  lastError?: string;
  updatedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  statusHistory?: Array<{
    status: string;
    updatedBy: string;
    updatedAt: string;
    reason: string;
    previousStatus: string;
  }>;
  createdAt: string;
}

interface PaymentUpdateFormProps {
  applicationId: string;
  paymentDetails: PaymentDetails | null;
  onPaymentUpdate: (updatedPayment: PaymentDetails) => void;
  canEdit: boolean;
}

export const PaymentUpdateForm: React.FC<PaymentUpdateFormProps> = ({
  applicationId,
  paymentDetails,
  onPaymentUpdate,
  canEdit
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    paymentStatus: paymentDetails?.status || 'pending',
    paymentMethod: paymentDetails?.paymentMethod || 'cash',
    amount: paymentDetails?.amount?.toString() || '500',
    receipt: paymentDetails?.receipt || '',
    reason: '',
    errorMessage: ''
  });
  const { toast } = useToast();

  // Determine if payment is completed
  const isPaymentCompleted = paymentDetails?.status === 'completed';
  
  // Show form by default if payment is not completed, unless user is actively viewing details
  const shouldShowForm = !isPaymentCompleted && !isEditing;
  
  // Check if this is creating a new payment record
  const isCreatingNewPayment = !paymentDetails;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await put<any>(`/api/v1/admission/admin/${applicationId}/payment`, {
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod,
        amount: parseFloat(formData.amount),
        receipt: formData.receipt,
        reason: formData.reason || `Payment status updated to ${formData.paymentStatus}`,
        errorMessage: formData.errorMessage || null
      });

      if (response.success) {
        onPaymentUpdate(response.data);
        setIsEditing(false);
        toast({
          title: 'Success',
          description: 'Payment details updated successfully',
        });
      } else {
        throw new Error(response.message || 'Failed to update payment details');
      }
    } catch (error) {
      console.error('Error updating payment details:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      paymentStatus: paymentDetails?.status || 'pending',
      paymentMethod: paymentDetails?.paymentMethod || 'cash',
      amount: paymentDetails?.amount?.toString() || '500',
      receipt: paymentDetails?.receipt || '',
      reason: '',
      errorMessage: ''
    });
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd/MM/yyyy hh:mm a');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-3 h-3" />;
      case 'pending':
        return <CreditCard className="w-3 h-3" />;
      case 'failed':
        return <X className="w-3 h-3" />;
      case 'processing':
        return <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>;
      case 'expired':
        return <span className="text-xs">⏰</span>;
      default:
        return <CreditCard className="w-3 h-3" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            {isCreatingNewPayment ? 'Create Payment Details' : 
             isPaymentCompleted ? 'Payment Details' : 'Update Payment Details'}
          </div>
          {canEdit && isPaymentCompleted && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(isEditing || (shouldShowForm && canEdit) || (isCreatingNewPayment && canEdit)) ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isCreatingNewPayment && !isEditing && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>No payment record found.</strong> Please create payment details below.
                </p>
              </div>
            )}
            {shouldShowForm && !isEditing && !isCreatingNewPayment && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Payment Status:</strong> {paymentDetails?.status || 'Pending'} - Please update the payment details below.
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="razorpay">Razorpay</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <Label htmlFor="receipt">Receipt Number</Label>
                <Input
                  id="receipt"
                  value={formData.receipt}
                  onChange={(e) => setFormData(prev => ({ ...prev, receipt: e.target.value }))}
                  placeholder="Enter receipt number"
                />
              </div>
            </div>

            {/* Conditional Fields */}
            {(formData.paymentStatus === 'failed' || formData.paymentStatus === 'processing') && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="reason">Reason for Status Change</Label>
                  <Input
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Enter reason for this status change"
                  />
                </div>

                {formData.paymentStatus === 'failed' && (
                  <div>
                    <Label htmlFor="errorMessage">Error Message (optional)</Label>
                    <Input
                      id="errorMessage"
                      value={formData.errorMessage}
                      onChange={(e) => setFormData(prev => ({ ...prev, errorMessage: e.target.value }))}
                      placeholder="Enter specific error message if known"
                    />
                  </div>
                )}
              </div>
            )}

            <Separator />

            <div className="flex justify-end space-x-2">
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isCreatingNewPayment ? 'Creating...' : isEditing ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isCreatingNewPayment ? 'Create Payment' : isEditing ? 'Update Payment' : 'Save Payment Details'}
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (shouldShowForm && !canEdit) || (isCreatingNewPayment && !canEdit) ? (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>Payment Status:</strong> {
                paymentDetails?.status === 'completed' ? 'Completed' :
                paymentDetails?.status || 'No payment record'
              }
            </p>
            <p className="text-sm text-blue-600 mt-2">
              {isCreatingNewPayment ? 
                'Payment details need to be created. Please contact an administrator.' :
                isPaymentCompleted ? 
                'Payment has been completed successfully.' :
                'Payment details need to be updated. Please contact an administrator.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Payment Completion Banner */}
            {isPaymentCompleted && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <div>
                    <p className="text-green-800 text-sm font-medium">
                      Payment Successfully Completed
                    </p>
                    <p className="text-green-600 text-xs">
                      Application fee has been received and verified.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Main Payment Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Amount</Label>
                <p className="text-sm text-gray-900">
                  {paymentDetails?.currency} {paymentDetails?.amount}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Payment Status</Label>
                <div className="flex flex-col gap-1">
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(paymentDetails?.status || 'pending')} flex items-center gap-1 w-fit`}
                  >
                    {getStatusIcon(paymentDetails?.status || 'pending')}
                    {paymentDetails?.status}
                  </Badge>
                  {paymentDetails?.attempts && paymentDetails.attempts > 0 && (
                    <p className="text-xs text-gray-500">
                      Attempts: {paymentDetails.attempts}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Payment Method</Label>
                <p className="text-sm text-gray-900 capitalize">
                  {paymentDetails?.paymentMethod?.replace('_', ' ')}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Payment Date</Label>
                <p className="text-sm text-gray-900">
                  {paymentDetails?.updatedAt ? formatDate(paymentDetails.updatedAt) : paymentDetails?.createdAt ? formatDate(paymentDetails.createdAt) : 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Receipt</Label>
                <p className="text-sm text-gray-900">
                  {paymentDetails?.receipt || 'N/A'}
                </p>
              </div>
              {paymentDetails?.verifiedAt && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Verified At</Label>
                  <p className="text-sm text-gray-900">
                    {formatDate(paymentDetails.verifiedAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Error Information */}
            {paymentDetails?.lastError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <Label className="text-sm font-medium text-red-800">Last Error</Label>
                <p className="text-sm text-red-700 mt-1">{paymentDetails.lastError}</p>
              </div>
            )}

            {/* Status History */}
            {paymentDetails?.statusHistory && paymentDetails.statusHistory.length > 0 && (
              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">Payment History</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {paymentDetails.statusHistory.slice().reverse().map((history, index) => (
                    <div key={index} className="bg-gray-50 border rounded-md p-3 text-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="outline" 
                              className={`${getStatusColor(history.status)} text-xs`}
                            >
                              {history.status}
                            </Badge>
                            {history.previousStatus && (
                              <span className="text-gray-500 text-xs">
                                from {history.previousStatus}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 text-xs">{history.reason}</p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {formatDate(history.updatedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};