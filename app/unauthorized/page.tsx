'use client';

import { useRouter } from 'next/navigation';
import { ShieldX } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleLogout = () => {
    // Clear auth token
    document.cookie = 'auth_token=; path=/; max-age=0';
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl text-center">
        <ShieldX size={80} className="mx-auto text-red-600 mb-6" />
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Access Denied</h1>
        <p className="text-xl text-gray-600 mb-8">
          You don't have permission to access this page.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="bg-gray-200 text-gray-800 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-300 transition"
          >
            Go Back
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}