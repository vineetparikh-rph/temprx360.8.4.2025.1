"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  FileText,
  Download,
  Mail,
  Eye,
  Building2,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';

interface Pharmacy {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
}

interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
}

export default function PoliciesPage() {
  const { data: session } = useSession();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [policyTemplates, setPolicyTemplates] = useState<PolicyTemplate[]>([]);
  const [selectedPharmacies, setSelectedPharmacies] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('temperature-monitoring');
  const [pharmacistInCharge, setPharmacistInCharge] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPoliciesData();

    // Set default values
    const today = new Date().toISOString().split('T')[0];
    setEffectiveDate(today);
    setEmailTo(session?.user?.email || '');
  }, [session]);

  const fetchPoliciesData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/policies');
      if (response.ok) {
        const data = await response.json();
        setPharmacies(data.pharmacies || []);
        setPolicyTemplates(data.availablePolicies || []);
        setError(null);
      } else {
        throw new Error('Failed to fetch policies data');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePolicy = async (action: 'generate' | 'preview', email: boolean = false) => {
    if (action === 'generate' && selectedPharmacies.length === 0) {
      setError('Please select at least one pharmacy');
      return;
    }

    if (!pharmacistInCharge.trim()) {
      setError('Please enter the Pharmacist-in-Charge name');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const requestBody = {
        action,
        policyType: selectedTemplate,
        ...(selectedPharmacies.length === 1
          ? { pharmacyId: selectedPharmacies[0] }
          : { pharmacyIds: selectedPharmacies }
        ),
        pharmacistInCharge: pharmacistInCharge.trim(),
        effectiveDate,
        ...(email && emailTo && { emailTo })
      };

      const response = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate policy';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If we can't parse the error as JSON, use the status text
          errorMessage = `${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Check if response is JSON or PDF based on content type
      const contentType = response.headers.get('content-type');
      const isPDF = contentType?.includes('application/pdf');

      if (action === 'preview') {
        // Preview always returns PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);
      } else if (email) {
        // Email action returns JSON response
        if (isPDF) {
          // If PDF returned for email, something went wrong
          setError('Expected email confirmation but received PDF. Check server logs.');
        } else {
          const result = await response.json();
          alert(result.message || (result.emailSent ? 'Policy emailed successfully!' : 'Policy generated but email failed'));
        }
      } else {
        // Generate action
        if (selectedPharmacies.length === 1 && isPDF) {
          // Single pharmacy - download PDF
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const pharmacyName = pharmacies.find(p => p.id === selectedPharmacies[0])?.name || 'Pharmacy';
          a.download = `Temperature_Policy_${pharmacyName.replace(/\s+/g, '_')}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          // Multiple pharmacies or JSON response - show summary
          const result = await response.json();
          alert(result.message);
        }
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handlePharmacyToggle = (pharmacyId: string) => {
    setSelectedPharmacies(prev =>
      prev.includes(pharmacyId)
        ? prev.filter(id => id !== pharmacyId)
        : [...prev, pharmacyId]
    );
  };

  const selectAllPharmacies = () => {
    setSelectedPharmacies(pharmacies.map(p => p.id));
  };

  const clearPharmacySelection = () => {
    setSelectedPharmacies([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Temperature Policies & Procedures
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate NJ Board of Pharmacy compliant temperature monitoring policies
        </p>
      </div>

      {/* Policy Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Policy Configuration
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Policy Details */}
          <div className="space-y-4">
            <div>
              <Label>Policy Template</Label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {policyTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {policyTemplates.find(t => t.id === selectedTemplate) && (
                <p className="text-xs text-gray-500 mt-1">
                  {policyTemplates.find(t => t.id === selectedTemplate)?.description}
                </p>
              )}
            </div>

            <div>
              <Label>Pharmacist-in-Charge *</Label>
              <Input
                type="text"
                value={pharmacistInCharge}
                onChange={(e) => setPharmacistInCharge(e.target.value)}
                placeholder="John Smith, PharmD"
                required
              />
            </div>

            <div>
              <Label>Effective Date</Label>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Email To (Optional)</Label>
              <Input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
          </div>

          {/* Pharmacy Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Select Pharmacies</Label>
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectAllPharmacies}
                >
                  Select All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearPharmacySelection}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              {pharmacies.length === 0 ? (
                <p className="text-gray-500 text-sm">No pharmacies available</p>
              ) : (
                <div className="space-y-2">
                  {pharmacies.map((pharmacy) => (
                    <label
                      key={pharmacy.id}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPharmacies.includes(pharmacy.id)}
                        onChange={() => handlePharmacyToggle(pharmacy.id)}
                        className="rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{pharmacy.name}</div>
                        <div className="text-xs text-gray-500">
                          {pharmacy.address || 'Address not specified'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {selectedPharmacies.length} of {pharmacies.length} pharmacies selected
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={() => generatePolicy('preview')}
            disabled={generating || !pharmacistInCharge.trim()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview Template
          </Button>

          <Button
            onClick={() => generatePolicy('generate')}
            disabled={generating || selectedPharmacies.length === 0 || !pharmacistInCharge.trim()}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {generating ? 'Generating...' : 'Generate Policy'}
          </Button>

          <Button
            onClick={() => generatePolicy('generate', true)}
            disabled={generating || selectedPharmacies.length === 0 || !emailTo || !pharmacistInCharge.trim()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Email Policy
          </Button>
        </div>
      </div>

      {/* Policy Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          🧊 Temperature Monitoring Policy Features
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Compliance Standards:</h4>
            <ul className="space-y-1 text-blue-700 dark:text-blue-300">
              <li>• <a href="https://www.njconsumeraffairs.gov/regulations/Chapter-39-Pharmacy.pdf" target="_blank" rel="noopener noreferrer" className="hover:underline">N.J. Admin. Code § 13:39-5.11</a></li>
              <li>• <a href="https://www.fda.gov/drugs/pharmaceutical-quality-resources/drug-supply-chain-security-act-dscsa" target="_blank" rel="noopener noreferrer" className="hover:underline">FDA Good Distribution Practices</a></li>
              <li>• <a href="https://www.usp.org/sites/default/files/usp/document/harmonization/gen-chapter/g05_pf_ira_30_6_2004.pdf" target="_blank" rel="noopener noreferrer" className="hover:underline">USP Chapter &lt;1079&gt;</a></li>
              <li>• <a href="https://www.cdc.gov/vaccines/hcp/admin/storage/toolkit/storage-handling-toolkit.pdf" target="_blank" rel="noopener noreferrer" className="hover:underline">CDC Vaccine Storage Toolkit</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Policy Includes:</h4>
            <ul className="space-y-1 text-blue-700 dark:text-blue-300">
              <li>• Storage requirements & temperature ranges</li>
              <li>• Monitoring & calibration procedures</li>
              <li>• Excursion protocols & reporting</li>
              <li>• Staff training requirements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}