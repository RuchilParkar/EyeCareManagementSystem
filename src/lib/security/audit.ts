import { mockAuditLogs } from '@/mock';

export interface LogAuditEventParams {
  actorUserId: string;
  userName?: string;
  userRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  target?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Server-Side Security & HIPAA Audit Event Logger
 * Never logs passwords, tokens, or sensitive credentials.
 */
export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  const auditItem = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    actorUserId: params.actorUserId,
    userName: params.userName || 'System User',
    userRole: params.userRole || 'USER',
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    target: params.target || `${params.entityType}:${params.entityId}`,
    ipAddress: params.ipAddress || '127.0.0.1',
    metadata: params.metadata || {},
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  // Sync with Mock in-memory store
  mockAuditLogs.unshift(auditItem as unknown as import('@/types').AuditLog);
}
