import React from 'react';
import { Building2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PublicHeader, Footer } from '@/components/shared';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Button } from '@/components/ui';
import { mockDepartments, mockServices, mockDoctors } from '@/mock';

export default function DepartmentsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicHeader />

      {/* Header Banner */}
      <section className="bg-white border-b border-[#E2E8F0] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <Badge variant="scheduled">CLINICAL DIVISIONS</Badge>
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Eye Care Departments & Centers of Excellence
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl mx-auto">
            Our specialized subspecialty divisions offer comprehensive ophthalmic diagnosis, laser surgery, and ongoing medical management.
          </p>
        </div>
      </section>

      {/* Departments Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {mockDepartments.map((dept) => {
            const deptServices = mockServices.filter((s) => s.departmentId === dept.id);
            const deptDoctors = mockDoctors.filter((d) => d.departmentId === dept.id);

            return (
              <Card key={dept.id} hoverable className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0F4C81] flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <Badge variant="active">Operational</Badge>
                  </div>
                  <CardTitle className="text-xl">{dept.name}</CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    {dept.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-xs font-semibold text-[#0F172A] bg-slate-50 p-3 rounded-xl border border-[#E2E8F0]/80">
                    <div>
                      <span className="text-[#64748B] font-normal block">Specialist Doctors</span>
                      <span>{deptDoctors.length > 0 ? `${deptDoctors.length} On Duty` : '2 On Call'}</span>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div>
                      <span className="text-[#64748B] font-normal block">Available Services</span>
                      <span>{deptServices.length > 0 ? `${deptServices.length} Procedures` : '3 Procedures'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-[#64748B] block">Featured Procedures:</span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#0F172A]">
                      {deptServices.slice(0, 4).map((s) => (
                        <li key={s.id} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                          <span className="truncate">{s.name}</span>
                        </li>
                      ))}
                      {deptServices.length === 0 && (
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                          <span>Specialty Consultation</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter>
                  <a href="/doctors" className="w-full">
                    <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Department Doctors
                    </Button>
                  </a>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
