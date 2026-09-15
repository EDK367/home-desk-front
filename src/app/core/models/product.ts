import { CategoryResponse } from "./category";

export interface ProductRequest { 
    sku: string;
    name: string;
    description?: string;
    categoryId: number;
    unitOfMeasure: ProductRequest.UnitOfMeasureEnum;
    salePrice: number;
    minStockLevel: number;
}

export interface ProductResponse { 
    id?: number;
    sku?: string;
    name?: string;
    description?: string;
    category?: CategoryResponse;
    unitOfMeasure?: ProductResponse.UnitOfMeasureEnum;
    salePrice?: number;
    minStockLevel?: number;
    stock?: number;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export namespace ProductRequest {
    export const UnitOfMeasureEnum = {
        Unit: 'UNIT',
        Set: 'SET',
    } as const;
    export type UnitOfMeasureEnum = typeof UnitOfMeasureEnum[keyof typeof UnitOfMeasureEnum];
}

export namespace ProductResponse {
    export const UnitOfMeasureEnum = {
        Unit: 'UNIT',
        Set: 'SET',
    } as const;
    export type UnitOfMeasureEnum = typeof UnitOfMeasureEnum[keyof typeof UnitOfMeasureEnum];
}


export interface ProductStockResponse { 
    productId?: number;
    sku?: string;
    name?: string;
    stock?: number;
    minStockLevel?: number;
    updatedAt?: string;
}

