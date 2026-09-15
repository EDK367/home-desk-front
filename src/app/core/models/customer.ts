export interface CustomerRequest { 
    fullName: string;
    taxNumber?: string;
    phone?: string;
    email?: string;
    address?: string;
}

export interface CustomerResponse { 
    id?: number;
    fullName?: string;
    taxNumber?: string;
    phone?: string;
    email?: string;
    address?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

