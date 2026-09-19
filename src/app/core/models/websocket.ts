export interface WsNotification {
  id: string;
  type: 'low-stock' | 'purchase' | 'sale' | 'payment' | 'audit' | 'general';
  title: string;
  message: string;
  timestamp: Date;
  rawPayload?: any;
}

export interface LowStockPayload {
  productId?: number;
  sku?: string;
  productName?: string;
  stock?: number;
  minimumStock?: number;
  message?: string;
}

export interface NewPurchasePayload {
  purchaseId?: number;
  supplierName?: string;
  totalAmount?: number;
  message?: string;
}

export interface NewSalePayload {
  saleId?: number;
  invoiceNumber?: string;
  customerName?: string;
  totalAmount?: number;
  message?: string;
}

export interface NewPaymentPayload {
  paymentId?: number;
  saleId?: number;
  paymentMethodName?: string;
  amount?: number;
  message?: string;
}

export interface AuditLogPayload {
  auditLogId?: number;
  username?: string;
  action?: string;
  module?: string;
  entityName?: string;
  entityId?: string;
  description?: string;
  message?: string;
}
