'use client';

import React, { useState } from 'react';
import {
  AdminGuard,
  PortalShell,
  Card,
  Table,
  Badge,
  Button,
  SearchBar,
  Select,
  Modal,
  useToast,
} from '@/components/shared';
import { mockOpdQueue, mockDoctors } from '@/mock';
import { OpdQueueItem } from '@/types';

export default function AdminOpdQueuePage() {
  const { addToast } = useToast();
  const [queue, setQueue] = useState<OpdQueueItem[]>(mockOpdQueue);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [doctorFilter, setDoctorFilter] = useState('ALL');

  // Modal for reassigning room/doctor
  const [selectedItem, setSelectedItem] = useState<OpdQueueItem | null>(null);
  const [newDoctorId, setNewDoctorId] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredQueue = queue.filter((item) => {
    const matchesSearch =
      item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesDoctor = doctorFilter === 'ALL' || item.doctorId === doctorFilter;
    return matchesSearch && matchesStatus && matchesDoctor;
  });

  const waitingCount = queue.filter((i) => i.status === 'WAITING').length;
  const inConsultCount = queue.filter((i) => i.status === 'IN_CONSULTATION').length;
  const completedCount = queue.filter((i) => i.status === 'COMPLETED').length;

  const handleOpenReassignModal = (item: OpdQueueItem) => {
    setSelectedItem(item);
    setNewDoctorId(item.doctorId);
    setNewRoom(item.roomNumber || '');
    setIsModalOpen(true);
  };

  const handleSaveReassignment = () => {
    if (!selectedItem) return;
    const doctorObj = mockDoctors.find((d) => d.id === newDoctorId);
    setQueue((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              doctorId: newDoctorId,
              doctorName: doctorObj ? `${doctorObj.firstName} ${doctorObj.lastName}` : item.doctorName,
              roomNumber: newRoom,
            }
          : item
      )
    );
    addToast({
      type: 'success',
      title: 'Queue Updated',
      message: `Reassigned Token ${selectedItem.tokenNumber} to Room ${newRoom}.`,
    });
    setIsModalOpen(false);
  };

  const columns = [
    {
      key: 'tokenNumber',
      header: 'Token #',
      cell: (item: OpdQueueItem) => (
        <span className="font-mono text-sm font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded">
          {item.tokenNumber}
        </span>
      ),
    },
    {
      key: 'patientName',
      header: 'Patient Name',
      cell: (item: OpdQueueItem) => (
        <div>
          <p className="font-semibold text-gray-900">{item.patientName}</p>
          <p className="text-xs text-gray-500">Check-in: {new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      ),
    },
    {
      key: 'doctorName',
      header: 'Assigned Doctor',
      cell: (item: OpdQueueItem) => (
        <div>
          <p className="text-sm text-gray-900 font-medium">{item.doctorName}</p>
          <p className="text-xs text-gray-500">Room: {item.roomNumber || 'Unassigned'}</p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      cell: (item: OpdQueueItem) => {
        const variant = item.priority === 'URGENT' || item.priority === 'EMERGENCY' ? 'danger' : 'neutral';
        return <Badge variant={variant}>{item.priority}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item: OpdQueueItem) => {
        let variant: 'warning' | 'info' | 'success' | 'neutral' = 'neutral';
        if (item.status === 'WAITING') variant = 'warning';
        if (item.status === 'IN_CONSULTATION') variant = 'info';
        if (item.status === 'COMPLETED') variant = 'success';
        return <Badge variant={variant}>{item.status.replace('_', ' ')}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (item: OpdQueueItem) => (
        <Button variant="outline" size="sm" onClick={() => handleOpenReassignModal(item)}>
          Reassign / Room
        </Button>
      ),
    },
  ];

  return (
    <AdminGuard>
      <PortalShell activePath="/admin/opd">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">OPD Operations & Token Management</h1>
            <p className="text-sm text-gray-600 mt-1">Real-time outpatient department queue tracking, triage status, and room allocations.</p>
          </div>

          {/* Key OPD Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 border-l-4 border-l-brand-600">
              <p className="text-xs font-medium text-gray-500 uppercase">Total Today</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{queue.length}</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-amber-500">
              <p className="text-xs font-medium text-gray-500 uppercase">Waiting in Lounge</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{waitingCount}</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-sky-500">
              <p className="text-xs font-medium text-gray-500 uppercase">In Doctor Room</p>
              <p className="text-2xl font-bold text-sky-700 mt-1">{inConsultCount}</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-emerald-500">
              <p className="text-xs font-medium text-gray-500 uppercase">Completed Consults</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{completedCount}</p>
            </Card>
          </div>

          {/* Filters Bar */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search patient name or token #..."
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'WAITING', label: 'Waiting' },
                  { value: 'IN_CONSULTATION', label: 'In Consultation' },
                  { value: 'COMPLETED', label: 'Completed' },
                ]}
              />
              <Select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Doctors' },
                  ...mockDoctors.map((d) => ({
                    value: d.id,
                    label: `${d.firstName} ${d.lastName}`,
                  })),
                ]}
              />
            </div>
          </Card>

          {/* OPD Table */}
          <Card>
            <Table
              data={filteredQueue}
              columns={columns}
              emptyMessage="No OPD patient tokens match the current filter."
            />
          </Card>
        </div>

        {/* Modal for Reassignment */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Reassign Token ${selectedItem?.tokenNumber || ''}`}
        >
          <div className="space-y-4 py-2">
            <p className="text-xs text-gray-600">
              Patient: <strong className="text-gray-900">{selectedItem?.patientName}</strong>
            </p>

            <Select
              label="Assigned Doctor"
              value={newDoctorId}
              onChange={(e) => setNewDoctorId(e.target.value)}
              options={mockDoctors.map((d) => ({
                value: d.id,
                label: `${d.firstName} ${d.lastName} (${d.specialization})`,
              }))}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consultation Room / Cabin
              </label>
              <input
                type="text"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                placeholder="e.g. Room 102 - Ophthal 1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveReassignment}>Save Allocation</Button>
            </div>
          </div>
        </Modal>
      </PortalShell>
    </AdminGuard>
  );
}
