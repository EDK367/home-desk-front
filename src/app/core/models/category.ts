export interface CategoryRequest { 
    name: string;
    description?: string;
}

export interface CategoryResponse { 
    id?: number;
    name?: string;
    description?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ChangeCategoryRequest { 
    categoryId: number;
}

export interface ChangeMinStockRequest { 
    minStockLevel: number;
}
