export interface AuditLogResponse {
  id: number;
  userId?: string;
  username?: string;
  userFullName?: string;
  action: string;
  module: string;
  entityName?: string;
  entityId?: string;
  description?: string;
  createdAt: string;
}

export interface AuditLogRequest {
  action: string;
  module: string;
  entityName?: string;
  entityId?: string;
  description?: string;
}
