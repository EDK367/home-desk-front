import { CustomerResponse } from "./customer";
import { PaymentMethodResponse } from "./payment";
import { ProductResponse } from "./product";
import { UserResponse } from "./user";

export interface ChangeSalePriceRequest { 
    salePrice: number;
}

export interface SaleItemRequest { 
    productId: number;
    quantity: number;
    unitPrice?: number;
}

export interface SaleItemResponse { 
    id?: number;
    product?: ProductResponse;
    quantity?: number;
    unitPrice?: number;
    subtotal?: number;
    createdAt?: string;
}

export interface SalePaymentRequest { 
    saleId?: number;
    paymentMethodId: number;
    amount: number;
    paymentDate?: string;
    referenceNumber?: string;
    notes?: string;
}


export interface SalePaymentResponse { 
    id?: number;
    saleId?: number;
    paymentMethod?: PaymentMethodResponse;
    amount?: number;
    paymentDate?: string;
    referenceNumber?: string;
    notes?: string;
    createdAt?: string;
}

export interface SaleRequest { 
    customerId: number;
    invoiceNumber?: string;
    statusId?: number;
    saleDate?: string;
    invoicePdfPath?: string;
    items: Array<SaleItemRequest>;
    payments?: Array<SalePaymentRequest>;
}

export interface SaleResponse { 
    id?: number;
    customer?: CustomerResponse;
    user?: UserResponse;
    status?: SaleStatusResponse;
    invoiceNumber?: string;
    saleDate?: string;
    subtotal?: number;
    taxAmount?: number;
    totalAmount?: number;
    invoicePdfPath?: string;
    items?: Array<SaleItemResponse>;
    payments?: Array<SalePaymentResponse>;
    createdAt?: string;
    updatedAt?: string;
}

export interface SaleStatusChangeRequest { 
    statusId: number;
}

export interface SaleStatusResponse { 
    id?: number;
    name?: string;
    description?: string;
    isActive?: boolean;
    createdAt?: string;
}