'use client';

import React from 'react';
import { useAuth } from '@/context/AuthProvider';

export default function MyPollsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Polls</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="mb-4">This is a placeholder for the list of your polls.</p>
        <p className="text-gray-600 mb-4">You are logged in as: {user?.email}</p>
        
        {/* TODO: Implement polls list */}
        <div className="border border-dashed border-gray-300 p-6 rounded-md text-center">
          <p className="text-gray-500">Your polls will be displayed here</p>
        </div>
      </div>
    </div>
  );
}