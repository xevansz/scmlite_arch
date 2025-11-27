import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../utils/api';
import { ReCaptcha } from '../components/ReCaptcha';

export function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const recaptchaRef = useRef<any>(null);

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
    setRecaptchaError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (!recaptchaToken) {
      setRecaptchaError('Please verify you\'re not a robot');
      return;
    }

    setLoading(true);
    try {
      await authApi.signup({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        recaptchaToken,
      });
      setMessage({ type: 'success', text: 'Account created successfully! Redirecting to login...' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Signup failed' });
      // Reset reCAPTCHA on error
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-white mb-2">Signup</h1>
          <p className="text-[#8b92a7]">Create your account to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="full_name" className="block text-white mb-2">
              Full Name
            </label>
            <input
              id="full_name"
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-white mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-white mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-white mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
              placeholder="Confirm your password"
            />
          </div>

          <div className='flex justify-center w-full'>
            <ReCaptcha 
              onChange={handleRecaptchaChange} 
              error={recaptchaError}
              ref={recaptchaRef}
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded ${
                message.type === 'success'
                  ? 'bg-green-500/20 border border-green-500 text-green-400'
                  : 'bg-red-500/20 border border-red-500 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#3b82f6] text-white rounded hover:bg-[#2563eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-[#8b92a7] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#3b82f6] hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
