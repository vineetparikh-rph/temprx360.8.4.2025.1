"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Building2, MapPin, Phone, Mail, Edit, Save, X, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  userPharmacies: Array<{
    pharmacy: {
      id: string;
      name: string;
      code: string;
      address?: string;
      phone?: string;
      fax?: string;
      dea?: string;
      npi?: string;
      cdc?: string;
      ncpdp?: string;
    };
  }>;
}

export default function UserInfo() {
  const { data: session } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  
  // Form data for editing
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      setUserProfile(data.user);
      
      // Initialize form data
      const nameParts = data.user.name?.split(' ') || ['', ''];
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: data.user.email || '',
        phone: data.user.phone || '',
        address: data.user.address || ''
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phone,
          address: formData.address
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      await fetchUserProfile(); // Refresh data
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    if (userProfile) {
      const nameParts = userProfile.name?.split(' ') || ['', ''];
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        address: userProfile.address || ''
      });
    }
    setIsEditing(false);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !userProfile) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            User Information
          </h3>
          {!isEditing ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Personal Information */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-5 w-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Personal Information
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                />
              ) : (
                <p className="text-gray-800 dark:text-white/90 font-medium mt-1">
                  {formData.firstName || 'Not set'}
                </p>
              )}
            </div>
            
            <div>
              <Label>Last Name</Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
              ) : (
                <p className="text-gray-800 dark:text-white/90 font-medium mt-1">
                  {formData.lastName || 'Not set'}
                </p>
              )}
            </div>
            
            <div>
              <Label>Email</Label>
              <p className="text-gray-800 dark:text-white/90 font-medium mt-1">
                {userProfile?.email}
              </p>
              {isEditing && (
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              )}
            </div>
            
            <div>
              <Label>Phone</Label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              ) : (
                <p className="text-gray-800 dark:text-white/90 font-medium mt-1">
                  {formData.phone || 'Not set'}
                </p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <Label>Address</Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your address"
                />
              ) : (
                <p className="text-gray-800 dark:text-white/90 font-medium mt-1">
                  {formData.address || 'Not set'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Pharmacy Information */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-5 w-5 text-green-600" />
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Linked Pharmacies
            </h4>
          </div>
          
          {userProfile?.userPharmacies && userProfile.userPharmacies.length > 0 ? (
            <div className="space-y-4">
              {userProfile.userPharmacies.map((userPharmacy) => (
                <div key={userPharmacy.pharmacy.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-800 dark:text-white/90 mb-3 text-lg">
                    {userPharmacy.pharmacy.name}
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Address: </span>
                        <span className="text-gray-800 dark:text-white/90">
                          {userPharmacy.pharmacy.address || 'Not set'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Phone: </span>
                        <span className="text-gray-800 dark:text-white/90">
                          {userPharmacy.pharmacy.phone || 'Not set'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Fax: </span>
                        <span className="text-gray-800 dark:text-white/90">
                          {userPharmacy.pharmacy.fax || 'Not set'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">DEA: </span>
                      <span className="text-gray-800 dark:text-white/90 font-mono">
                        {userPharmacy.pharmacy.dea || 'Not set'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">NPI: </span>
                      <span className="text-gray-800 dark:text-white/90 font-mono">
                        {userPharmacy.pharmacy.npi || 'Not set'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">CDC: </span>
                      <span className="text-gray-800 dark:text-white/90 font-mono">
                        {userPharmacy.pharmacy.cdc || 'Not set'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">NCPDP: </span>
                      <span className="text-gray-800 dark:text-white/90 font-mono">
                        {userPharmacy.pharmacy.ncpdp || 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No pharmacy access assigned</p>
          )}
        </div>
      </div>
    </div>
  );
}
