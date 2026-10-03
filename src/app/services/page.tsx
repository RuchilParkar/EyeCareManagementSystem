'use client';

import React, { useState, useMemo } from 'react';
import { Clock, DollarSign, ArrowRight } from 'lucide-react';
import { PublicHeader, Footer } from '@/components/shared';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Button, SearchBar } from '@/components/ui';
import { mockServices, mockDepartments } from '@/mock';

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const filteredServices = useMemo(() => {
    return mockServices.filter((srv) => {
      const matchesSearch =
        srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        srv.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = selectedDept === 'ALL' || srv.departmentId === selectedDept;

      return matchesSearch && matchesDept;
    });
  }, [searchQuery, selectedDept]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicHeader />

      {/* Header Banner */}
      <section className="bg-white border-b border-[#E2E8F0] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <Badge variant="scheduled">CLINICAL SERVICES</Badge>
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Specialized Eye Care & Surgical Treatments
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl mx-auto">
            Explore our comprehensive eye care options, diagnostic procedures, and subspecialty optical evaluations.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="w-full sm:w-80">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search services by keyword..."
            />
          </div>

          {/* Department Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedDept('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                selectedDept === 'ALL'
                  ? 'bg-[#0F4C81] text-white border-[#0F4C81]'
                  : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-slate-50'
              }`}
            >
              All Services
            </button>
            {mockDepartments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDept(dept.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap ${
                  selectedDept === dept.id
                    ? 'bg-[#0F4C81] text-white border-[#0F4C81]'
                    : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-slate-50'
                }`}
              >
                {dept.name}
              </button>
            ))}
          </div>
        </div>

        {/* Services Cards Grid */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E2E8F0]">
            <p className="text-sm font-semibold text-[#0F172A]">No matching services found</p>
            <p className="text-xs text-[#64748B] mt-1">Try clearing your search keyword or selecting another department filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((srv) => {
              const dept = mockDepartments.find((d) => d.id === srv.departmentId);

              return (
                <Card key={srv.id} hoverable className="flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="scheduled" dot={false}>
                        {dept?.name || 'Ophthalmology'}
                      </Badge>
                      <Badge variant="active">Active</Badge>
                    </div>
                    <CardTitle className="text-lg">{srv.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {srv.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#64748B] pt-2 border-t border-[#E2E8F0]/60">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#0F4C81]" />
                        {srv.durationMinutes} Minutes
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-[#0F172A]">
                        <DollarSign className="w-4 h-4 text-[#0D9488]" />
                        ${srv.price}
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <a href="/login" className="w-full">
                      <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        Book Service
                      </Button>
                    </a>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
