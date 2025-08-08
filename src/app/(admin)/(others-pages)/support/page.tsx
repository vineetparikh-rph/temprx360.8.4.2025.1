"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Mail, Phone, MessageCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';

export default function Support() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    issue: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit support request');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-white/[0.03] text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">
            Support Request Submitted
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Thank you for contacting us! We've received your support request and will get back to you within 24 hours.
          </p>
          <Button onClick={() => setIsSubmitted(false)}>
            Submit Another Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Support Center
        </h3>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Get Help
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Need assistance with TempRx360? We're here to help! Fill out the form and we'll get back to you as soon as possible.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">Email Support</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">admin@georgiesrx.com</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">Response Time</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Within 24 hours</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">Emergency Support</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">For critical temperature alerts</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Common Issues We Can Help With:
              </h5>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Sensor connectivity problems</li>
                <li>• Temperature alert configuration</li>
                <li>• Dashboard navigation questions</li>
                <li>• Account access issues</li>
                <li>• Data export and reporting</li>
                <li>• Compliance documentation</li>
              </ul>
            </div>
          </div>

          {/* Support Form */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Submit Support Request
            </h4>

            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                  <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Your Name</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <Label>Describe Your Issue</Label>
                <textarea
                  value={formData.issue}
                  onChange={(e) => handleInputChange('issue', e.target.value)}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Please describe your issue in detail. Include any error messages, steps you've taken, and what you were trying to accomplish."
                />
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <h6 className="font-medium text-gray-800 dark:text-white/90 mb-2">
                  Your Information (Auto-filled)
                </h6>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p><strong>User:</strong> {session?.user?.email}</p>
                  <p><strong>Role:</strong> {session?.user?.role}</p>
                  {session?.user?.pharmacies && session.user.pharmacies.length > 0 && (
                    <p><strong>Pharmacy:</strong> {session.user.pharmacies.map(p => p.name).join(', ')}</p>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting Request...' : 'Submit Support Request'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your request will be sent to admin@georgiesrx.com with your account details for faster assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
