'use client';

import React from 'react';
import { useAuth } from '@/context/AuthProvider';
import PollForm from '@/components/PollForm';

export default function CreatePollPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-center text-lg">Please log in to create a poll.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Create a New Poll</h1>
      <PollForm />
    </div>
  );
}