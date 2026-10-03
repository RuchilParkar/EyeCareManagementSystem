'use client';

import React, { useState } from 'react';
import {
  AdminGuard,
  PortalShell,
  Card,
  Table,
  Badge,
  SearchBar,
  Select,
} from '@/components/shared';
import { mockAuditLogs } from '@/mock';
import { AuditLog } from '@/types';

export default function AdminActivityLogsPage() {
  const [logs] = useState<AuditLog[]>(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.userName || log.actorUserId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.target || log.entityType || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || log.userRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  const columns = [
    {
      header: 'Timestamp',
      cell: (log: AuditLog) => (
        <span className="font-mono text-xs text-gray-600">
          {new Date(log.timestamp || log.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'User',
      cell: (log: AuditLog) => (
        <div>
          <p className="font-semibold text-gray-900 text-sm">{log.userName || log.actorUserId}</p>
          <p className="text-xs text-gray-500">{log.ipAddress || '192.168.1.1'}</p>
        </div>
      ),
    },
    {
      header: 'Role',
      cell: (log: AuditLog) => (
        <Badge variant={log.userRole === 'ADMIN' ? 'danger' : log.userRole === 'DOCTOR' ? 'info' : 'neutral'}>
          {log.userRole || 'USER'}
        </Badge>
      ),
    },
    {
      header: 'Action Performed',
      cell: (log: AuditLog) => (
        <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded">
          {log.action}
        </span>
      ),
    },
    {
      header: 'Target / Entity',
      cell: (log: AuditLog) => (
        <span className="text-sm text-gray-800">{log.target || `${log.entityType} (${log.entityId})`}</span>
      ),
    },
  ];

  return (
    <AdminGuard>
      <PortalShell activePath="/admin/activity">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Audit Trail & Activity Logs</h1>
            <p className="text-sm text-gray-600 mt-1">HIPAA compliant security audit log tracking user logins, EMR accesses, and administrative changes.</p>
          </div>

          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search user, action, or target entity..."
              />
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Roles' },
                  { value: 'ADMIN', label: 'Admin' },
                  { value: 'DOCTOR', label: 'Doctor' },
                  { value: 'PATIENT', label: 'Patient' },
                  { value: 'STAFF', label: 'Staff' },
                ]}
              />
            </div>
          </Card>

          <Card>
            <Table
              data={filteredLogs}
              columns={columns}
              keyExtractor={(log) => log.id}
              emptyMessage="No audit logs match your search filters."
            />
          </Card>
        </div>
      </PortalShell>
    </AdminGuard>
  );
}
