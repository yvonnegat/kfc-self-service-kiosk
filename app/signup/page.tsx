'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, User, AlertCircle, CheckCircle, ChefHat, BarChart3, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'kitchen' as 'kitchen' | 'manager',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    };
    const strength = Object.values(checks).filter(Boolean).length;
    return { checks, strength };
  };

  const passwordStrength = checkPasswordStrength(formData.password);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        
        // Store token in cookie
        document.cookie = `auth_token=${data.data.token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
        
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify(data.data.user));

        // Show success message briefly then redirect
        setTimeout(() => {
          if (data.data.user.role === 'manager') {
            router.push('/manager');
          } else {
            router.push('/kitchen');
          }
        }, 2000);
      } else {
        if (data.details) {
          // Handle Zod validation errors
          const errors: Record<string, string> = {};
          data.details.forEach((err: any) => {
            errors[err.path[0]] = err.message;
          });
          setValidationErrors(errors);
        } else {
          setError(data.error || 'Signup failed');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Account Created!</h1>
          <p className="text-gray-600 mb-6">
            Welcome to KFC Kiosk! Redirecting you to your dashboard...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🍗 KFC Kiosk</h1>
          <p className="text-gray-600">Create Staff Account</p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => handleChange('role', 'kitchen')}
            className={`p-4 rounded-lg border-2 transition ${
              formData.role === 'kitchen'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <ChefHat size={32} className={`mx-auto mb-2 ${formData.role === 'kitchen' ? 'text-blue-600' : 'text-gray-600'}`} />
            <div className="font-semibold">Kitchen Staff</div>
          </button>
          <button
            type="button"
            onClick={() => handleChange('role', 'manager')}
            className={`p-4 rounded-lg border-2 transition ${
              formData.role === 'manager'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <BarChart3 size={32} className={`mx-auto mb-2 ${formData.role === 'manager' ? 'text-green-600' : 'text-gray-600'}`} />
            <div className="font-semibold">Manager</div>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="text-red-600" size={20} />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none ${
                  validationErrors.username 
                    ? 'border-red-400 focus:border-red-600' 
                    : 'border-gray-300 focus:border-red-600'
                }`}
                placeholder="Enter username"
                disabled={loading}
              />
            </div>
            {validationErrors.username && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.username}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              3-50 characters, letters, numbers, and underscores only
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full pl-10 pr-12 py-3 border-2 rounded-lg focus:outline-none ${
                  validationErrors.password 
                    ? 'border-red-400 focus:border-red-600' 
                    : 'border-gray-300 focus:border-red-600'
                }`}
                placeholder="Enter password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {validationErrors.password && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.password}</p>
            )}
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        passwordStrength.strength >= level
                          ? passwordStrength.strength === 4
                            ? 'bg-green-500'
                            : passwordStrength.strength === 3
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs space-y-1">
                  <div className={passwordStrength.checks.length ? 'text-green-600' : 'text-gray-500'}>
                    {passwordStrength.checks.length ? '✓' : '○'} At least 8 characters
                  </div>
                  <div className={passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-500'}>
                    {passwordStrength.checks.uppercase ? '✓' : '○'} One uppercase letter
                  </div>
                  <div className={passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-500'}>
                    {passwordStrength.checks.lowercase ? '✓' : '○'} One lowercase letter
                  </div>
                  <div className={passwordStrength.checks.number ? 'text-green-600' : 'text-gray-500'}>
                    {passwordStrength.checks.number ? '✓' : '○'} One number
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className={`w-full pl-10 pr-12 py-3 border-2 rounded-lg focus:outline-none ${
                  validationErrors.confirmPassword 
                    ? 'border-red-400 focus:border-red-600' 
                    : 'border-gray-300 focus:border-red-600'
                }`}
                placeholder="Confirm password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-lg font-bold text-white text-lg transition ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : formData.role === 'kitchen'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-red-600 hover:text-red-700 font-semibold">
              Login
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}