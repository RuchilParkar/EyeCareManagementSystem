import React from 'react';
import { Eye, Shield, Award, Heart, Sparkles, CheckCircle } from 'lucide-react';
import { PublicHeader, Footer } from '@/components/shared';
import { Card, CardContent, Badge, Button } from '@/components/ui';

export default function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: 'Clinical Excellence',
      description: 'Adhering to international sub-specialty ophthalmology standards and evidence-based eye care treatments.',
    },
    {
      icon: Heart,
      title: 'Patient-Centered Compassion',
      description: 'Prioritizing patient comfort, clear communication, and personalized vision correction plans.',
    },
    {
      icon: Sparkles,
      title: 'Modern Diagnostic Innovation',
      description: 'Equipped with state-of-the-art OCT imaging, corneal topography, and ultra-precise laser systems.',
    },
    {
      icon: Award,
      title: 'Board-Certified Specialists',
      description: 'Our medical staff consists of fellowship-trained ophthalmologists and optometrists.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicHeader />

      {/* Hero Banner */}
      <section className="bg-white border-b border-[#E2E8F0] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="active" className="mb-4">ABOUT CLEARVISION</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Dedicated to Preserving & Restoring Vision
          </h1>
          <p className="mt-3 text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            ClearVision Eye Care Institute combines world-class subspecialist doctors, digital records, and compassionate healthcare to deliver superior eye care.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-sky-50/50">
            <CardContent className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] text-[#0F4C81] flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-[#0F172A]">Our Mission</h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                To eliminate preventable blindness and provide accessible, high-precision eye diagnostics, optical remedies, and advanced surgical therapies to our community.
              </p>
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-teal-50/50">
            <CardContent className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-[#0F172A]">Our Vision</h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                To be a premier eye hospital recognized for clinical leadership, digital medical record integration, surgical innovation, and exceptional patient satisfaction.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-12 bg-white border-y border-[#E2E8F0] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#0F172A]">Our Core Pillars</h2>
            <p className="text-xs text-[#64748B] mt-1">Foundational principles guiding our medical team every day.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <Card key={v.title} hoverable>
                  <CardContent className="p-6 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0F4C81] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-[#0F172A]">{v.title}</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">{v.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modern Technology Highlight */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-[#0F172A] text-white rounded-3xl p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-4 max-w-xl">
            <Badge variant="scheduled" dot={false} className="bg-sky-950 text-sky-300 border-sky-800">
              State-of-the-Art Care
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Advanced Eye Diagnostic Facilities
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              From OCT 3D retinal mapping to Wavefront-guided LASIK topography, our clinic utilizes non-invasive diagnostic tools for accurate ocular assessments.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-2">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#0D9488]" /> Spectral-Domain OCT</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#0D9488]" /> Wavefront Topography</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#0D9488]" /> Computerized Visual Field</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#0D9488]" /> Digital Slit-Lamp Photography</li>
            </ul>
          </div>

          <div className="shrink-0">
            <a href="/doctors">
              <Button variant="secondary" size="lg">
                Meet Our Specialists
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
