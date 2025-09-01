'use client';

import React from 'react';
import RegisterForm from '@/components/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Register</h1>
      <RegisterForm />
    </div>
  );
}