import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Gem } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onSuccess }) => {
  const { register, isLoading } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate form inputs
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError(t('auth.fieldsRequired'));
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.register.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('auth.register.passwordTooShort'));
      return;
    }
    
    try {
      const { success, error } = await register(formData.name, formData.email, formData.password);
      
      if (success) {
        onSuccess();
      } else {
        console.error('Registration error:', error);
        setError(error?.message || t('auth.register.error'));
      }
    } catch (err) {
      console.error('Unexpected error during registration:', err);
      setError(t('auth.unexpectedError'));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Gem className="h-8 w-8 text-yellow-400" />
          <span className="text-3xl font-bold text-white lunova-brand">Lunova</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">{t('auth.register.title')}</h2>
        <p className="text-gray-300">{t('auth.register.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-white font-medium mb-2">{t('auth.fullName')}</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-yellow-400 focus:outline-none transition-colors"
              placeholder={t('auth.fullNamePlaceholder')}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-white font-medium mb-2">{t('auth.email')}</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-yellow-400 focus:outline-none transition-colors"
              placeholder={t('auth.emailPlaceholder')}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-white font-medium mb-2">{t('auth.password')}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-12 py-3 text-white focus:border-yellow-400 focus:outline-none transition-colors"
              placeholder={t('auth.passwordPlaceholder')}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-white font-medium mb-2">{t('auth.confirmPassword')}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-12 py-3 text-white focus:border-yellow-400 focus:outline-none transition-colors"
              placeholder={t('auth.confirmPasswordPlaceholder')}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            required
            className="w-4 h-4 text-yellow-400 bg-gray-800 border-gray-600 rounded focus:ring-yellow-400 focus:ring-2 mt-1"
          />
          <span className="ml-2 text-sm text-gray-300">
            {t('auth.register.agreeToTerms')}{' '}
            <a href="#" className="text-yellow-400 hover:text-yellow-300 transition-colors">
              {t('auth.register.termsOfService')}
            </a>{' '}
            {t('auth.register.and')}{' '}
            <a href="#" className="text-yellow-400 hover:text-yellow-300 transition-colors">
              {t('auth.register.privacyPolicy')}
            </a>
          </span>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-yellow-400 text-black py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('auth.register.creatingAccount') : t('auth.register.createAccount')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-300">
          {t('auth.register.haveAccount')}{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-yellow-400 hover:text-yellow-300 transition-colors font-semibold"
          >
            {t('auth.signIn')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;