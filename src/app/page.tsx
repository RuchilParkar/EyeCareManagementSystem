'use client';

import React from 'react';
import {
  Eye,
  Calendar,
  Sparkles,
  ShieldCheck,
  Award,
  Users,
  Clock,
  ArrowRight,
  CheckCircle,
  FileCheck,
} from 'lucide-react';
import { PublicHeader, Footer } from '@/components/shared';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Button, Avatar } from '@/components/ui';
import { mockServices, mockDoctors, mockHospital } from '@/mock';

export default function HomePage() {
  const stats = [
    { label: 'Board-Certified Specialists', value: '12+', icon: Award },
    { label: 'Eye Care Procedures Offered', value: '25+', icon: Eye },
    { label: 'Satisfied Patients Served', value: '1,400+', icon: Users },
    { label: 'On-Demand Appointments', value: '24/7', icon: Clock },
  ];

  const whyChooseUs = [
    {
      icon: Award,
      title: 'Fellowship-Trained Specialists',
      description: 'Our team comprises board-certified ophthalmologists and optometrists with specialized subspecialty expertise.',
    },
    {
      icon: Sparkles,
      title: 'Modern Diagnostic Equipment',
      description: 'Equipped with non-invasive OCT retinal scanners, Wavefront corneal topographers, and digital visual field instruments.',
    },
    {
      icon: FileCheck,
      title: 'Structured Medical Records',
      description: 'Seamless digital prescriptions, diagnostic history, and follow-up tracking accessible securely by patients and care teams.',
    },
    {
      icon: ShieldCheck,
      title: 'Patient-Centered Protocol',
      description: 'Spacious, calm clinic environments designed for minimal wait times and clear clinical communication.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicHeader />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-sky-50/50 border-b border-[#E2E8F0] py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <Badge variant="scheduled" className="bg-[#E0F2FE] text-[#0F4C81] border-[#0F4C81]/20 px-3 py-1">
              ADVANCED EYE CARE & LASIK CENTER
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
              Precision Vision Care for a Brighter Tomorrow
            </h1>

            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-xl">
              From routine vision screenings to complex vitreoretinal consultations, {mockHospital.name} delivers comprehensive digital eye care for your whole family.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <a href="/login">
                <Button variant="primary" size="lg" leftIcon={<Calendar className="w-4 h-4" />} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Book an Appointment
                </Button>
              </a>
              <a href="/services">
                <Button variant="outline" size="lg">
                  Explore Services
                </Button>
              </a>
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs text-[#64748B] border-t border-[#E2E8F0]">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#0D9488]" />
                <span>Instant Online Slot Booking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#0D9488]" />
                <span>Digital Optical Prescriptions</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Card Showcase */}
          <div className="relative">
            <Card className="p-6 bg-white shadow-xl border-[#E2E8F0] relative z-10 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0F4C81] text-white flex items-center justify-center">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">Clinical Care Summary</h3>
                    <p className="text-[10px] text-[#0D9488] font-semibold">Active Doctor Schedule</p>
                  </div>
                </div>
                <Badge variant="active">Live Queue</Badge>
              </div>

              <div className="space-y-3">
                {mockDoctors.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-[#E2E8F0]/80">
                    <div className="flex items-center gap-3">
                      <Avatar src={doc.profileImage} name={`Dr. ${doc.lastName}`} size="md" status="online" />
                      <div>
                        <p className="text-xs font-semibold text-[#0F172A]">Dr. {doc.firstName} {doc.lastName}</p>
                        <p className="text-[10px] text-[#64748B]">{doc.specialization}</p>
                      </div>
                    </div>
                    <Badge variant="scheduled" dot={false}>Available Today</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust & Quick Stats Bar */}
      <section className="bg-white border-b border-[#E2E8F0] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-3 p-2">
                <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0F4C81] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-[#0F172A]">{s.value}</p>
                  <p className="text-[11px] text-[#64748B] font-medium leading-tight">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Services Preview Section */}
      <section id="services-preview" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <Badge variant="scheduled" className="mb-2">SERVICES PREVIEW</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">Specialized Ophthalmic Services</h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">Comprehensive care tailored to your specific visual needs.</p>
          </div>
          <a href="/services">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All Services
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockServices.slice(0, 3).map((srv) => (
            <Card key={srv.id} hoverable className="flex flex-col justify-between">
              <CardHeader>
                <Badge variant="scheduled" dot={false} className="w-fit mb-2">
                  Duration: {srv.durationMinutes} min
                </Badge>
                <CardTitle className="text-base">{srv.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1">{srv.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-xs font-bold text-[#0D9488]">Standard Consultation Fee: ${srv.price}</p>
              </CardContent>
              <CardFooter>
                <a href="/login" className="w-full">
                  <Button variant="ghost" size="sm" className="w-full justify-between" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Book Consultation
                  </Button>
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-white border-y border-[#E2E8F0] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <Badge variant="active">EXCELLENCE IN EYE CARE</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">Why Patients Choose ClearVision</h2>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto">Combining human medical expertise with seamless digital convenience.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseUs.map((w) => {
              const Icon = w.icon;
              return (
                <Card key={w.title} className="p-2">
                  <CardContent className="p-5 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-[#0F172A]">{w.title}</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">{w.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Doctors Preview */}
      <section id="doctors-preview" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <Badge variant="scheduled" className="mb-2">MEDICAL STAFF</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">Our Attending Doctors</h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">Book a consultation directly with our leading specialists.</p>
          </div>
          <a href="/doctors">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View Doctor Directory
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockDoctors.map((doc) => (
            <Card key={doc.id} hoverable className="p-2">
              <CardContent className="p-5 flex items-start gap-4">
                <Avatar src={doc.profileImage} name={`Dr. ${doc.lastName}`} size="xl" status="online" />
                <div className="flex-1 min-w-0 space-y-1">
                  <Badge variant="active" className="mb-1">Available Today</Badge>
                  <h3 className="text-base font-bold text-[#0F172A]">Dr. {doc.firstName} {doc.lastName}</h3>
                  <p className="text-xs font-semibold text-[#0D9488]">{doc.specialization}</p>
                  <p className="text-xs text-[#64748B] line-clamp-2">{doc.bio}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Final Appointment CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-gradient-to-r from-[#0F4C81] to-[#1E3A8A] text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl">
          <Badge variant="scheduled" dot={false} className="bg-white/20 text-white border-white/30">
            READY FOR YOUR EYE CHECKUP?
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Book Your Eye Consultation Today
          </h2>
          <p className="text-xs sm:text-sm text-sky-100 max-w-xl mx-auto leading-relaxed">
            Select your preferred specialist, choose an available time slot, and manage your medical history securely online.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <a href="/login">
              <Button variant="secondary" size="lg" leftIcon={<Calendar className="w-4 h-4" />}>
                Book Appointment Now
              </Button>
            </a>
            <a href="/contact">
              <Button variant="outline" size="lg" className="bg-transparent text-white border-white/40 hover:bg-white/10">
                Contact Desk
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
