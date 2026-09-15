import { ProductResponse } from "./product";
import { SupplierResponse } from "./supplier";
import { UserResponse } from "./user";

export interface PurchaseItemRequest { 
    productId: number;
    quantity: number;
    unitCost: number;
}

export interface PurchaseItemResponse { 
    id?: number;
    product?: ProductResponse;
    quantity?: number;
    unitCost?: number;
    subtotal?: number;
    createdAt?: string;
}

export interface PurchaseRequest { 
    supplierId: number;
    statusId?: number;
    purchaseDate?: string;
    notes?: string;
    items: Array<PurchaseItemRequest>;
}

export interface PurchaseResponse { 
    id?: number;
    supplier?: SupplierResponse;
    user?: UserResponse;
    status?: PurchaseStatusResponse;
    purchaseDate?: string;
    subtotal?: number;
    taxAmount?: number;
    totalAmount?: number;
    notes?: string;
    items?: Array<PurchaseItemResponse>;
    createdAt?: string;
    updatedAt?: string;
}

export interface PurchaseStatusChangeRequest { 
    statusId: number;
}

export interface PurchaseStatusResponse { 
    id?: number;
    name?: string;
    description?: string;
    isActive?: boolean;
    createdAt?: string;
}
