export interface VwProductsLowestStock { 
    productId?: number;
    sku?: string;
    product?: string;
    category?: string;
    quantityOnHand?: number;
    minStockLevel?: number;
}

export interface VwProductsMostFrequentlyPurchased { 
    productId?: number;
    sku?: string;
    product?: string;
    category?: string;
    purchaseCount?: number;
    totalQuantityPurchased?: number;
    totalPurchaseAmount?: number;
}

export interface VwProductsMostInventoryMovement { 
    productId?: number;
    sku?: string;
    product?: string;
    category?: string;
    movementCount?: number;
}

export interface VwTop5SuppliersByPurchase { 
    supplierId?: number;
    supplierName?: string;
    purchaseCount?: number;
    totalPurchaseAmount?: number;
    lastPurchaseDate?: string;
}

export interface VwTop10CustomersBySale { 
    id?: number;
    customerName?: string;
    saleCount?: number;
    totalPurchaseAmount?: number;
    lastPurchaseDate?: string;
}

export interface VwTop10ProductsByRevenue { 
    productId?: number;
    sku?: string;
    productName?: string;
    categoryName?: string;
    totalQuantitySold?: number;
    totalRevenue?: number;
}

export interface VwTop10ProductsSold { 
    productId?: number;
    sku?: string;
    product?: string;
    category?: string;
    salePrice?: number;
    totalQuantitySold?: number;
    totalRevenue?: number;
}