// Fee structure types and interfaces

export interface FeeComponent {
  admissionFee: number;
  examPermitRegFee: number;
  specialFee: number;
  tuitionFee: number;
  feeFundCharges?: number;
  others: number;
}

// Removed QuotaFees interface - no longer needed

export type FeeStructureType = 
  | 'regular'
  | 'lateral_entry' 
  | 'evening'
  | 'tfw_regular'
  | 'tfw_let'
  | 'inter_state';

export interface SemesterFee {
  semester: number;
  semesterName: string;
  fees: FeeComponent;
  total: number;
}

export interface FeeStructure {
  id: string;
  type: FeeStructureType;
  academicYear: string;
  title: string;
  description?: string;
  effectiveDate: Date;
  isActive: boolean;
  semesters: SemesterFee[];
  grandTotal: number;
  hostelFee?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateFeeStructureData {
  type: FeeStructureType;
  academicYear: string;
  title: string;
  description?: string;
  effectiveDate: Date;
  semesters: Omit<SemesterFee, 'total'>[];
  hostelFee?: number;
}

export interface UpdateFeeStructureData extends Partial<CreateFeeStructureData> {
  id: string;
  isActive?: boolean;
}

export const FEE_STRUCTURE_TYPES: Record<FeeStructureType, string> = {
  regular: 'Regular Batch',
  lateral_entry: 'Lateral Entry (LET)', 
  evening: 'Evening Batch',
  tfw_regular: 'TFW Regular',
  tfw_let: 'TFW LET',
  inter_state: 'Inter State'
};

export const DEFAULT_SEMESTERS = [
  { number: 1, name: 'Semester 1' },
  { number: 2, name: 'Semester 2' },
  { number: 3, name: 'Semester 3' },
  { number: 4, name: 'Semester 4' },
  { number: 5, name: 'Semester 5' },
  { number: 6, name: 'Semester 6' }
];

// Validation helpers
export const validateFeeComponent = (component: FeeComponent): boolean => {
  return component.admissionFee >= 0 &&
         component.examPermitRegFee >= 0 &&
         component.specialFee >= 0 &&
         component.tuitionFee >= 0 &&
         component.others >= 0 &&
         (component.feeFundCharges === undefined || component.feeFundCharges >= 0);
};

export const calculateComponentTotal = (component: FeeComponent): number => {
  return component.admissionFee + 
         component.examPermitRegFee + 
         component.specialFee + 
         component.tuitionFee + 
         (component.feeFundCharges || 0) +
         component.others;
};

export const calculateSemesterTotal = (semester: SemesterFee): number => {
  return calculateComponentTotal(semester.fees);
};

export const calculateGrandTotal = (semesters: SemesterFee[]): number => {
  return semesters.reduce((total, semester) => total + semester.total, 0);
};