"use client";

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { Shield, CheckCircle, Clock, Users } from 'lucide-react';

export default function SignoutPage() {
  useEffect(() => {
    // Sign out the user when the page loads
    signOut({ redirect: false });
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            You've been signed out successfully
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Thank you for using TempRx360. We hope to see you again soon!
          </p>
        </div>

        {/* TempRx360 Information */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              TempRx360: Secure. Compliant. Incredibly Easy to Use.
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              At TempRx360, our mission is to provide every pharmacy with a free, real-time temperature monitoring dashboard that meets all compliance standards — without the hassle or cost.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-8">
              Built specifically for independent and community pharmacies, TempRx360 helps you stay fully compliant with CDC, FDA, Board of Pharmacy, and other regulatory bodies — while giving you peace of mind, every day.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Secure
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your data is protected with cloud-based encryption and accessible only to authorized users
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Compliant
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Automatically logs and stores temperature data for inspections and audits
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Clock className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Easy to Use
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No tech expertise needed — plug it in, and you're up and running
              </p>
            </div>
          </div>

          {/* Bottom Message */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
            <p className="text-blue-900 dark:text-blue-200 font-medium text-lg">
              No monthly fees. No complicated setup. Just powerful tools that help you focus on what matters most — patient care.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/signin"
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Sign In Again
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Learn More About TempRx360
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Questions? Need support? Contact us at{" "}
            <a
              href="mailto:support@temprx360.georgiesrx.com"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              support@temprx360.georgiesrx.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
