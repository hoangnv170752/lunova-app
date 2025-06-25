import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AuthLayout from './AuthLayout';

const ForgotPassword: React.FC = () => {
  const { t } = useLanguage();
  const { resetPassword, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    const { success, error } = await resetPassword(email);
    
    if (success) {
      setSuccess(true);
      setEmail('');
    } else {
      setError(error?.message || 'Failed to send password reset email. Please try again.');
    }
  };
  
  return (
    <AuthLayout title={t('auth.forgotPassword')}>
      <div className="space-y-6">
        <p className="text-center text-sm text-gray-300">
          {t('auth.forgotPasswordDescription')}
        </p>
        
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-green-900/30 border border-green-500 text-green-300 px-4 py-3 rounded-md flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>{t('auth.resetEmailSent')}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                {t('auth.email')}
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-500 text-white bg-gray-700 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.email')}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : null}
              {isLoading ? t('auth.sending') : t('auth.sendResetLink')}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-300">
              <Link to="/login" className="font-medium text-yellow-400 hover:text-yellow-300">
                {t('auth.backToLogin')}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
