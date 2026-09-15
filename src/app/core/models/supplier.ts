
import { ProductResponse } from "./product";
import { PhoneNumberResponse } from "./phone";
import { PhoneNumberRequest } from "./phone";

export interface SupplierProductRequest {
    supplierId: number;
    productId: number;
    supplierSku?: string;
    cost?: number;
}

export interface SupplierProductResponse {
    id?: number;
    supplier?: SupplierResponse;
    product?: ProductResponse;
    supplierSku?: string;
    cost?: number;
    lastPurchaseCost?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface SupplierProductUpdateRequest {
    supplierSku?: string;
    cost?: number;
}

export interface SupplierRequest {
    name: string;
    taxNumber: string;
    contactName: string;
    phones: Array<PhoneNumberRequest>;
    email: string;
    address: string;
}

export interface SupplierResponse {
    id?: number;
    name?: string;
    taxNumber?: string;
    contactName?: string;
    phones?: Array<PhoneNumberResponse>;
    email?: string;
    address?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}
