'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, AlertCircle, ChefHat, BarChart3 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<'kitchen' | 'manager'>('kitchen');

  // DEBUG LOGIN HANDLER - Let's see what's happening:

const handleLogin = async (e: React.FormEvent) => {
  console.log('🔥🔥🔥 FUNCTION CALLED - START!');
  e.preventDefault();
  setError('');
  setLoading(true);
  
  console.log('📝 Username:', username);
  console.log('📝 Password:', password ? '***' : 'EMPTY');

  try {
    console.log('📡 Sending request to /api/auth/login...');
    
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    console.log('📡 Response status:', res.status);
    
    const data = await res.json();
    
    console.log('✅ Login API response:', data);

    if (data.success) {
      const token = data.data.token;
      const user = data.data.user;
      
      console.log('✅ User data:', user);
      console.log('✅ Token:', token.substring(0, 30) + '...');
      
      // Set cookie
      document.cookie = `auth_token=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
      console.log('✅ Cookie set:', document.cookie);
      
      // Set localStorage
      localStorage.setItem('user', JSON.stringify(user));
      console.log('✅ LocalStorage set:', localStorage.getItem('user'));
      
      // Wait a bit for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Calculate redirect path
      const redirectPath = user.role === 'manager' ? '/manager' : '/kitchen';
      console.log('✅ Redirecting to:', redirectPath);
      
      // Force redirect
      router.push(redirectPath);
      console.log('🔥🔥🔥 FUNCTION COMPLETED - END!');
    } else {
      console.log('❌ Login failed:', data.error);
      setError(data.error || 'Login failed');
    }
  } catch (err) {
    console.error('❌ Login error:', err);
    setError('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🍗 KFC Kiosk</h1>
          <p className="text-gray-600">Staff Login Portal</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setLoginType('kitchen')}
            className={`p-4 rounded-lg border-2 transition ${
              loginType === 'kitchen'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <ChefHat size={32} className={`mx-auto mb-2 ${loginType === 'kitchen' ? 'text-blue-600' : 'text-gray-600'}`} />
            <div className="font-semibold">Kitchen Staff</div>
          </button>
          <button
            onClick={() => setLoginType('manager')}
            className={`p-4 rounded-lg border-2 transition ${
              loginType === 'manager'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <BarChart3 size={32} className={`mx-auto mb-2 ${loginType === 'manager' ? 'text-green-600' : 'text-gray-600'}`} />
            <div className="font-semibold">Manager</div>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="text-red-600" size={20} />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                placeholder="Enter username"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                placeholder="Enter password"
                disabled={loading}
              />
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full py-4 rounded-lg font-bold text-white text-lg transition ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : loginType === 'kitchen'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center mb-3">Demo Credentials:</p>
          <div className="space-y-2 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <div className="font-semibold text-blue-800">Kitchen Staff</div>
              <div className="text-gray-600">Username: kitchen | Password: kitchen123</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="font-semibold text-green-800">Manager</div>
              <div className="text-gray-600">Username: manager | Password: manager123</div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-red-600 hover:text-red-700 font-semibold"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}