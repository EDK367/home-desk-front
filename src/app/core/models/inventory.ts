import { ProductResponse } from './product';
import { UserResponse } from './user';

export interface ManualStockAdjustmentRequest {
    quantity: number;
    notes: string;
}

export interface InventoryResponse {
    id?: number;
    product?: ProductResponse;
    quantityOnHand?: number;
    isLowStock?: boolean;
    updatedAt?: string;
}

export interface InventoryLotResponse {
    id?: number;
    product?: ProductResponse;
    purchaseItemId?: number;
    purchaseId?: number;
    quantityReceived?: number;
    quantityRemaining?: number;
    unitCost?: number;
    receivedAt?: string;
    createdAt?: string;
}

export interface InventoryMovementResponse {
    id?: number;
    product?: ProductResponse;
    user?: UserResponse;
    movementType?: string;
    quantity?: number;
    balanceAfter?: number;
    referenceType?: string;
    referenceId?: number;
    costingMethod?: string;
    notes?: string;
    createdAt?: string;
}

export interface InventoryMovementLotResponse {
    id?: number;
    movementId?: number;
    lot?: InventoryLotResponse;
    quantity?: number;
    unitCost?: number;
}
