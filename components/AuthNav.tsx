'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';

const AuthNav = () => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="bg-white shadow-sm mb-6">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          Polling App
        </Link>
        
        <div className="flex space-x-4">
          {user ? (
            <>
              <Link 
                href="/create-poll" 
                className="text-gray-600 hover:text-indigo-600"
              >
                Create Poll
              </Link>
              <Link 
                href="/my-polls" 
                className="text-gray-600 hover:text-indigo-600"
              >
                My Polls
              </Link>
              <button 
                onClick={handleSignOut}
                className="text-gray-600 hover:text-indigo-600"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/auth/login" 
                className={`${pathname === '/auth/login' ? 'text-indigo-600 font-medium' : 'text-gray-600'} hover:text-indigo-600`}
              >
                Login
              </Link>
              <Link 
                href="/auth/register" 
                className={`${pathname === '/auth/register' ? 'text-indigo-600 font-medium' : 'text-gray-600'} hover:text-indigo-600`}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AuthNav;