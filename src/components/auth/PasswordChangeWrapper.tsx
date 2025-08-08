"use client";

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import PasswordChangeForm from './PasswordChangeForm';

interface PasswordChangeWrapperProps {
  children: React.ReactNode;
}

export default function PasswordChangeWrapper({ children }: PasswordChangeWrapperProps) {
  const { data: session, status, update } = useSession();
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.mustChangePassword) {
      setShowPasswordChange(true);
    }
  }, [session, status]);

  // Show loading while session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show password change form if user must change password
  if (showPasswordChange && session?.user?.mustChangePassword) {
    return <PasswordChangeForm />;
  }

  // Show normal content
  return <>{children}</>;
}
