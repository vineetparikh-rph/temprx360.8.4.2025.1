"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@/icons';
import { CheckCircle, Shield, Clock, Users } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    hearAbout: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Thank You!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              We've received your information and will contact you within 24 hours to discuss how TempRx360 can help your pharmacy stay compliant.
            </p>
          </div>
          <Link
            href="/signin"
            className="inline-flex items-center px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="w-full max-w-6xl mx-auto px-6 pt-10">
        <Link
          href="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to Sign In
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Information */}
          <div>
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                TempRx360: Secure. Compliant. Incredibly Easy to Use.
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                At TempRx360, our mission is to provide every pharmacy with a free, real-time temperature monitoring dashboard that meets all compliance standards — without the hassle or cost.
              </p>
            </div>

            <div className="mb-8">
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Built specifically for independent and community pharmacies, TempRx360 helps you stay fully compliant with CDC, FDA, Board of Pharmacy, and other regulatory bodies — while giving you peace of mind, every day.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-6 mb-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-green-500 mt-1" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Secure</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your data is protected with cloud-based encryption and accessible only to authorized users
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Compliant</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Automatically logs and stores temperature data for inspections and audits
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-green-500 mt-1" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Easy to Use</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No tech expertise needed — plug it in, and you're up and running
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <p className="text-blue-900 dark:text-blue-200 font-medium text-center">
                No monthly fees. No complicated setup. Just powerful tools that help you focus on what matters most — patient care.
              </p>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Get Started Today
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Fill out the form below and we'll contact you within 24 hours to discuss your pharmacy's temperature monitoring needs.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                  placeholder="your.email@pharmacy.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company *
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Your pharmacy name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  How did you hear about us? *
                </label>
                <select
                  name="hearAbout"
                  value={formData.hearAbout}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select an option</option>
                  <option value="google">Google Search</option>
                  <option value="referral">Referral from another pharmacy</option>
                  <option value="conference">Industry conference/event</option>
                  <option value="social">Social media</option>
                  <option value="email">Email marketing</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-500 text-white py-3 px-6 rounded-lg hover:bg-brand-600 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? 'Submitting...' : 'Get Started with TempRx360'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
