'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, Phone, Award, ArrowRight } from 'lucide-react';
import { PublicHeader, Footer } from '@/components/shared';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Button, SearchBar, Select, Avatar } from '@/components/ui';
import { mockDoctors, mockDepartments } from '@/mock';

export default function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const deptOptions = useMemo(() => {
    return [
      { label: 'All Departments', value: 'ALL' },
      ...mockDepartments.map((d) => ({ label: d.name, value: d.id })),
    ];
  }, []);

  const filteredDoctors = useMemo(() => {
    return mockDoctors.filter((doc) => {
      const fullName = `${doc.firstName} ${doc.lastName}`.toLowerCase();
      const spec = doc.specialization.toLowerCase();

      const matchesSearch =
        fullName.includes(searchQuery.toLowerCase()) ||
        spec.includes(searchQuery.toLowerCase());

      const matchesDept = selectedDept === 'ALL' || doc.departmentId === selectedDept;

      return matchesSearch && matchesDept;
    });
  }, [searchQuery, selectedDept]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicHeader />

      {/* Header Banner */}
      <section className="bg-white border-b border-[#E2E8F0] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <Badge variant="active">SPECIALIST DIRECTORY</Badge>
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Meet Our Ophthalmologists & Specialists
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl mx-auto">
            Board-certified eye care professionals committed to optical clarity, advanced surgical precision, and compassionate patient care.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="md:col-span-2">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search doctor by name, specialty, or condition..."
            />
          </div>
          <div>
            <Select
              options={deptOptions}
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            />
          </div>
        </div>

        {/* Doctor Cards */}
        {filteredDoctors.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E2E8F0]">
            <p className="text-sm font-semibold text-[#0F172A]">No doctors found matching criteria</p>
            <p className="text-xs text-[#64748B] mt-1">Try refining your search term or select another department filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDoctors.map((doc) => {
              const dept = mockDepartments.find((d) => d.id === doc.departmentId);

              return (
                <Card key={doc.id} hoverable className="flex flex-col justify-between">
                  <CardHeader className="flex-row items-start gap-4 space-y-0">
                    <Avatar
                      src={doc.profileImage}
                      name={`Dr. ${doc.firstName} ${doc.lastName}`}
                      size="xl"
                      status="online"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="scheduled" dot={false}>
                          {dept?.name || 'Specialist'}
                        </Badge>
                        <Badge variant="active">Available Today</Badge>
                      </div>
                      <CardTitle className="text-lg">
                        Dr. {doc.firstName} {doc.lastName}
                      </CardTitle>
                      <p className="text-xs font-semibold text-[#0D9488] mt-0.5">
                        {doc.specialization}
                      </p>
                      <CardDescription className="mt-2 line-clamp-2">
                        {doc.bio}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2 border-t border-[#E2E8F0]/60 pt-3 text-xs text-[#64748B]">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#0F4C81] shrink-0" />
                      <span>{doc.qualification}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#0F4C81] shrink-0" />
                      <span>{doc.phone}</span>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <a href="/login" className="w-full">
                      <Button variant="primary" size="sm" className="w-full" leftIcon={<Calendar className="w-3.5 h-3.5" />} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        Book Consultation with Dr. {doc.lastName}
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
