'use client';

import Image from "next/image";
import { useAuth } from '@/context/AuthProvider';
import Link from 'next/link';

export default function Home() {
  const { user, isLoading } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to the Polling App</h1>
        <p className="text-xl text-gray-600 mb-8">
          Create and share polls with your friends and colleagues
        </p>
        
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : user ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Hello, {user.email}</h2>
              <p className="mb-4">What would you like to do today?</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/create-poll"
                  className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Create a New Poll
                </Link>
                <Link 
                  href="/my-polls"
                  className="bg-white text-indigo-600 border border-indigo-600 px-6 py-3 rounded-md hover:bg-indigo-50 transition-colors"
                >
                  View My Polls
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
              <p className="mb-4">Sign in to create and manage polls</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/auth/login"
                  className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  href="/auth/register"
                  className="bg-white text-indigo-600 border border-indigo-600 px-6 py-3 rounded-md hover:bg-indigo-50 transition-colors"
                >
                  Register
                </Link>
              </div>
            </div>
            
            <div className="mt-12">
              <h2 className="text-2xl font-semibold mb-6">Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-medium mb-2">Create Polls</h3>
                  <p className="text-gray-600">Create custom polls with multiple options</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-medium mb-2">Share</h3>
                  <p className="text-gray-600">Share polls with friends via link</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-medium mb-2">Results</h3>
                  <p className="text-gray-600">View real-time results as votes come in</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
