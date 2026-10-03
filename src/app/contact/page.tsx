'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { PublicHeader, Footer } from '@/components/shared';
import { Input, Textarea, Button, Badge, Alert, Card, CardContent } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';

const contactSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits.'),
  subject: z.string().min(3, 'Subject is required.'),
  message: z.string().min(10, 'Message must be at least 10 characters long.'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { toastSuccess } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    await new Promise((res) => setTimeout(res, 400));
    setIsSubmitting(false);
    setSubmittedSuccess(true);
    toastSuccess('Inquiry Dispatched', `Thank you ${data.fullName}. Our clinical team will respond shortly.`);
    reset();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicHeader />

      {/* Header Banner */}
      <section className="bg-white border-b border-[#E2E8F0] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <Badge variant="scheduled">GET IN TOUCH</Badge>
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Contact ClearVision Eye Care Institute
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl mx-auto">
            Have questions regarding an appointment, surgical consultation, or insurance coverage? Our desk is ready to assist.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Emergency Notice Alert */}
        <Alert variant="warning" title="Emergency Eye Care Notice">
          If you are experiencing sudden vision loss, severe ocular trauma, or chemical exposure, please do not wait for a form response. Call our 24/7 Emergency Line immediately at <strong>+1 (555) 911-EYES</strong> or visit the nearest emergency room.
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4 p-6">
                <h3 className="text-base font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3">
                  Clinic Information
                </h3>

                <div className="flex items-start gap-3 text-xs text-[#0F172A]">
                  <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0F4C81] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold block">Main Facility Address</span>
                    <span className="text-[#64748B] block mt-0.5">
                      100 Medical Center Parkway, Suite 400, Springfield, OR 97477
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs text-[#0F172A]">
                  <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0F4C81] flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold block">Phone Lines</span>
                    <span className="text-[#64748B] block mt-0.5">
                      Appointments: +1 (555) 393-2020<br />
                      Emergency Desk: +1 (555) 911-EYES
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs text-[#0F172A]">
                  <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0F4C81] flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold block">Email Inquiries</span>
                    <span className="text-[#64748B] block mt-0.5">
                      contact@clearvisioneyecare.com
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs text-[#0F172A]">
                  <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0F4C81] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold block">Working Hours</span>
                    <span className="text-[#64748B] block mt-0.5">
                      Mon – Fri: 8:00 AM – 6:00 PM<br />
                      Sat: 9:00 AM – 2:00 PM<br />
                      Sun: Emergency On-Call
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Send Us a Message</h3>
                  <p className="text-xs text-[#64748B]">Fill out the form below and our staff will respond within 24 business hours.</p>
                </div>

                {submittedSuccess && (
                  <Alert variant="success" title="Message Received!" onDismiss={() => setSubmittedSuccess(false)}>
                    Your inquiry has been submitted. A patient services representative will contact you shortly.
                  </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      placeholder="e.g. Jane Doe"
                      error={errors.fullName?.message}
                      {...register('fullName')}
                      required
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="e.g. jane.doe@example.com"
                      error={errors.email?.message}
                      {...register('email')}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Phone Number"
                      placeholder="e.g. +1 (555) 234-5678"
                      error={errors.phone?.message}
                      {...register('phone')}
                      required
                    />

                    <Input
                      label="Subject"
                      placeholder="e.g. LASIK Consultation Inquiry"
                      error={errors.subject?.message}
                      {...register('subject')}
                      required
                    />
                  </div>

                  <Textarea
                    label="Message / Inquiry Details"
                    placeholder="Describe your question or requested eye service..."
                    rows={4}
                    error={errors.message?.message}
                    {...register('message')}
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    rightIcon={<Send className="w-4 h-4" />}
                  >
                    Submit Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
