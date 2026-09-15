export interface PaymentMethodRequest { 
    name: string;
    description?: string;
}

export interface PaymentMethodResponse { 
    id?: number;
    name?: string;
    description?: string;
    isActive?: boolean;
    createdAt?: string;
}

