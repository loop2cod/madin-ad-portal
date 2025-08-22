import { get, post, put, del, patch } from '@/utilities/AxiosInterceptor';
import { 
    FeeStructure, 
    CreateFeeStructureData, 
    UpdateFeeStructureData,
    FeeStructureType 
} from '@/types/fee-structure';

export interface FeeStructureResponse {
    success: boolean;
    message: string;
    data: {
        feeStructure: FeeStructure;
    };
}

export interface FeeStructuresResponse {
    success: boolean;
    message: string;
    data: {
        feeStructures: FeeStructure[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalCount: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    };
}

export interface FeeStructureTypesResponse {
    success: boolean;
    message: string;
    data: {
        types: Record<FeeStructureType, string>;
    };
}

export interface AcademicYearsResponse {
    success: boolean;
    message: string;
    data: {
        academicYears: string[];
    };
}

export interface CloneFeeStructureRequest {
    newAcademicYear: string;
    newTitle: string;
}

const API_BASE = '/api/v1/fee-structures';

export const feeStructureService = {
    // Get all fee structures with filtering and pagination
    getAll: async (params?: {
        page?: number;
        limit?: number;
        type?: string;
        academicYear?: string;
        isActive?: boolean;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<FeeStructuresResponse> => {
        const queryParams = new URLSearchParams();
        
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, value.toString());
                }
            });
        }

        const url = queryParams.toString() ? `${API_BASE}?${queryParams}` : API_BASE;
        return get<FeeStructuresResponse>(url);
    },

    // Get fee structure by ID
    getById: async (id: string): Promise<FeeStructureResponse> => {
        return get<FeeStructureResponse>(`${API_BASE}/${id}`);
    },

    // Create new fee structure
    create: async (data: CreateFeeStructureData): Promise<FeeStructureResponse> => {
        return post<FeeStructureResponse>(API_BASE, data);
    },

    // Update fee structure
    update: async (id: string, data: UpdateFeeStructureData): Promise<FeeStructureResponse> => {
        return put<FeeStructureResponse>(`${API_BASE}/${id}`, data);
    },

    // Delete fee structure (deactivate)
    delete: async (id: string): Promise<{ success: boolean; message: string }> => {
        return del<{ success: boolean; message: string }>(`${API_BASE}/${id}`);
    },

    // Toggle fee structure status
    toggleStatus: async (id: string): Promise<FeeStructureResponse> => {
        return patch<FeeStructureResponse>(`${API_BASE}/${id}/toggle-status`);
    },

    // Get fee structures by academic year
    getByAcademicYear: async (academicYear: string, activeOnly = true): Promise<{ success: boolean; message: string; data: { feeStructures: FeeStructure[] } }> => {
        const params = activeOnly ? '?activeOnly=true' : '';
        return get<{ success: boolean; message: string; data: { feeStructures: FeeStructure[] } }>(`${API_BASE}/by-year/${academicYear}${params}`);
    },

    // Get fee structure by type and academic year
    getByTypeAndYear: async (type: FeeStructureType, academicYear: string): Promise<FeeStructureResponse> => {
        return get<FeeStructureResponse>(`${API_BASE}/by-type/${type}/year/${academicYear}`);
    },

    // Get available fee structure types
    getTypes: async (): Promise<FeeStructureTypesResponse> => {
        return get<FeeStructureTypesResponse>(`${API_BASE}/types`);
    },

    // Get available academic years
    getAcademicYears: async (): Promise<AcademicYearsResponse> => {
        return get<AcademicYearsResponse>(`${API_BASE}/academic-years`);
    },

    // Clone fee structure for new academic year
    clone: async (id: string, data: CloneFeeStructureRequest): Promise<FeeStructureResponse> => {
        return post<FeeStructureResponse>(`${API_BASE}/${id}/clone`, data);
    }
};

export default feeStructureService;