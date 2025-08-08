"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Building2, Calendar, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  userPharmacies: Array<{
    pharmacy: {
      id: string;
      name: string;
      code: string;
      address?: string;
      phone?: string;
    };
  }>;
}

export default function AccountSettings() {
  const { data: session } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordSuccess(true);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordSection(false);
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Account Settings
        </h3>

        {/* User Information */}
        <div className="space-y-6">
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                User Information
              </h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Full Name</p>
                <p className="text-gray-800 dark:text-white/90 font-medium">
                  {userProfile?.name || 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
                <p className="text-gray-800 dark:text-white/90 font-medium">
                  {userProfile?.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Role</p>
                <p className="text-gray-800 dark:text-white/90 font-medium capitalize">
                  {userProfile?.role}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Member Since</p>
                <p className="text-gray-800 dark:text-white/90 font-medium">
                  {userProfile?.createdAt ? formatDate(userProfile.createdAt) : 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Pharmacy Information */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-5 w-5 text-green-600" />
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Pharmacy Access
              </h4>
            </div>
            
            {userProfile?.userPharmacies && userProfile.userPharmacies.length > 0 ? (
              <div className="space-y-3">
                {userProfile.userPharmacies.map((userPharmacy) => (
                  <div key={userPharmacy.pharmacy.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-800 dark:text-white/90 mb-2">
                      {userPharmacy.pharmacy.name}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Code: </span>
                        <span className="text-gray-800 dark:text-white/90 uppercase">
                          {userPharmacy.pharmacy.code}
                        </span>
                      </div>
                      {userPharmacy.pharmacy.address && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Address: </span>
                          <span className="text-gray-800 dark:text-white/90">
                            {userPharmacy.pharmacy.address}
                          </span>
                        </div>
                      )}
                      {userPharmacy.pharmacy.phone && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Phone: </span>
                          <span className="text-gray-800 dark:text-white/90">
                            {userPharmacy.pharmacy.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No pharmacy access assigned</p>
            )}
          </div>

          {/* Password Change Section */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-red-600" />
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Password & Security
                </h4>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
              >
                {showPasswordSection ? 'Cancel' : 'Change Password'}
              </Button>
            </div>

            {passwordSuccess && (
              <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-green-800 dark:text-green-200 text-sm">
                  Password changed successfully!
                </p>
              </div>
            )}

            {showPasswordSection && (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {passwordError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-red-800 dark:text-red-200 text-sm">{passwordError}</p>
                  </div>
                )}

                <div>
                  <Label>Current Password</Label>
                  <div className="relative">
                    <Input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label>Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" size="sm" disabled={passwordLoading}>
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
