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
  Input,
  Select,
  Textarea,
  Modal,
  useToast,
} from '@/components/shared';
import { mockServices } from '@/mock';
import { HospitalService } from '@/types';

export default function AdminServicesPage() {
  const { addToast } = useToast();
  const initialServices: HospitalService[] = mockServices.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category || 'consultation',
    basePrice: s.basePrice || s.price,
    durationMinutes: s.durationMinutes,
    description: s.description,
    isAvailable: s.isAvailable ?? (s.status === 'ACTIVE'),
  }));
  const [services, setServices] = useState<HospitalService[]>(initialServices);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'consultation' | 'diagnostic' | 'surgery' | 'eyewear'>('consultation');
  const [basePrice, setBasePrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [description, setDescription] = useState('');

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !basePrice || !durationMinutes) {
      addToast({ type: 'warning', title: 'Missing fields', message: 'Please complete all required fields.' });
      return;
    }

    const newSvc: HospitalService = {
      id: `srv-${Date.now()}`,
      name,
      category,
      basePrice: parseFloat(basePrice),
      durationMinutes: parseInt(durationMinutes, 10),
      description,
      isAvailable: true,
    };

    setServices([newSvc, ...services]);
    addToast({ type: 'success', title: 'Service Created', message: `${name} has been added to the hospital rate card.` });
    setIsModalOpen(false);

    // Reset Form
    setName('');
    setBasePrice('');
    setDurationMinutes('');
    setDescription('');
  };

  const columns = [
    {
      header: 'Service / Procedure Name',
      accessor: (s: HospitalService) => (
        <div>
          <p className="font-semibold text-gray-900">{s.name}</p>
          <p className="text-xs text-gray-500 max-w-sm truncate">{s.description}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: (s: HospitalService) => (
        <Badge variant="neutral">{s.category.toUpperCase()}</Badge>
      ),
    },
    {
      header: 'Est. Duration',
      accessor: (s: HospitalService) => (
        <span className="text-sm text-gray-700 font-medium">{s.durationMinutes} mins</span>
      ),
    },
    {
      header: 'Base Price',
      accessor: (s: HospitalService) => (
        <span className="text-sm font-bold text-gray-900">${s.basePrice.toFixed(2)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (s: HospitalService) => (
        <Badge variant={s.isAvailable ? 'success' : 'neutral'}>
          {s.isAvailable ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminGuard>
      <PortalShell activePath="/admin/services">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hospital Rate Card & Services</h1>
              <p className="text-sm text-gray-600 mt-1">Configure diagnostic procedures, consultation tariffs, surgical procedures, and optical charges.</p>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              + Add New Service
            </Button>
          </div>

          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search procedure name or description..."
              />
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Categories' },
                  { value: 'consultation', label: 'Consultation' },
                  { value: 'diagnostic', label: 'Diagnostic' },
                  { value: 'surgery', label: 'Surgery' },
                  { value: 'eyewear', label: 'Eyewear & Optical' },
                ]}
              />
            </div>
          </Card>

          <Card>
            <Table
              data={filteredServices}
              columns={columns}
              keyExtractor={(s) => s.id}
              emptyMessage="No services found matching the criteria."
            />
          </Card>

          {/* Add Service Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Add New Clinical Service"
          >
            <form onSubmit={handleCreateService} className="space-y-4 py-2">
              <Input
                label="Service Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Optical Coherence Tomography (OCT)"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Category *"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as 'consultation' | 'diagnostic' | 'surgery' | 'eyewear')}
                  options={[
                    { value: 'consultation', label: 'Consultation' },
                    { value: 'diagnostic', label: 'Diagnostic' },
                    { value: 'surgery', label: 'Surgery' },
                    { value: 'eyewear', label: 'Eyewear & Optical' },
                  ]}
                  required
                />
                <Input
                  label="Base Price ($) *"
                  type="number"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="150.00"
                  required
                />
              </div>

              <Input
                label="Duration (Minutes) *"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="30"
                required
              />

              <Textarea
                label="Service Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of clinical procedure..."
                rows={3}
              />

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Service
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </PortalShell>
    </AdminGuard>
  );
}
