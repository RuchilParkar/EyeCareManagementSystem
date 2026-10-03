import React from 'react';
import { Eye, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="footer" className="bg-[#0F172A] text-slate-300 border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0F4C81] text-white flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">ClearVision</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Comprehensive digital eye care platform connecting patients with specialist ophthalmologists and clinic administration.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Specialties</h4>
            <ul className="flex flex-col gap-2 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">General Ophthalmology</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cornea & LASIK Surgery</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Retina & Diabetic Screening</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Glaucoma Evaluation</a></li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Role Portals</h4>
            <ul className="flex flex-col gap-2 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Patient Portal</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Doctor Portal</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Hospital Admin Dashboard</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Contact Us</h4>
            <ul className="flex flex-col gap-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0D9488] shrink-0" />
                <span>100 Medical Center Pkwy, Suite 400</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#0D9488] shrink-0" />
                <span>+1 (555) 393-2020</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0D9488] shrink-0" />
                <span>contact@clearvisioneyecare.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} ClearVision Eye Care System. Academic Engineering Project.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400">Terms of Service</a>
            <a href="#" className="hover:text-slate-400">Accessibility Statement</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
