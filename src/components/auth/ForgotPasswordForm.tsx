import React, { useState } from 'react';
import { Mail, ArrowLeft, Gem, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToLogin }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setIsEmailSent(true);
  };

  if (isEmailSent) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="flex items-center justify-center space-x-3 mb-8">
          <Gem className="h-8 w-8 text-yellow-400" />
          <span className="text-3xl font-bold text-white lunova-brand">Lunova</span>
        </div>
        
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 mb-8">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">{t('auth.forgotPassword.emailSent')}</h2>
          <p className="text-gray-300 mb-6">
            {t('auth.forgotPassword.checkEmail')} <span className="text-yellow-400">{email}</span>
          </p>
          <p className="text-sm text-gray-400">
            {t('auth.forgotPassword.emailInstructions')}
          </p>
        </div>

        <button
          onClick={onBackToLogin}
          className="flex items-center justify-center space-x-2 text-yellow-400 hover:text-yellow-300 transition-colors mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('auth.forgotPassword.backToLogin')}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Gem className="h-8 w-8 text-yellow-400" />
          <span className="text-3xl font-bold text-white lunova-brand">Lunova</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">{t('auth.forgotPassword.title')}</h2>
        <p className="text-gray-300">{t('auth.forgotPassword.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-white font-medium mb-2">{t('auth.email')}</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-yellow-400 focus:outline-none transition-colors"
              placeholder={t('auth.emailPlaceholder')}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-yellow-400 text-black py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.sendResetLink')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onBackToLogin}
          className="flex items-center justify-center space-x-2 text-yellow-400 hover:text-yellow-300 transition-colors mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('auth.forgotPassword.backToLogin')}</span>
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;