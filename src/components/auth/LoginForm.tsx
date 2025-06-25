import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Gem } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  onSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSwitchToForgotPassword, onSuccess }) => {
  const { login, isLoading } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: 'admin@lunova.com', // Pre-filled with mock user credentials
    password: 'lunova123'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = await login(formData.email, formData.password);
    if (success) {
      onSuccess();
    } else {
      setError(t('auth.login.error'));
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
        <h2 className="text-3xl font-bold text-white mb-2">{t('auth.login.title')}</h2>
        <p className="text-gray-300">{t('auth.login.subtitle')}</p>
      </div>

      {/* Demo credentials info */}
      <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4 mb-6">
        <h3 className="text-yellow-400 font-semibold mb-2">Demo Credentials</h3>
        <div className="text-sm text-gray-300 space-y-1">
          <p><strong>Email:</strong> admin@lunova.com</p>
          <p><strong>Password:</strong> lunova123</p>
          <p className="text-xs text-gray-400 mt-2">
            Or use any email/password combination (password must be 6+ characters)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

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

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 text-yellow-400 bg-gray-800 border-gray-600 rounded focus:ring-yellow-400 focus:ring-2"
            />
            <span className="ml-2 text-sm text-gray-300">{t('auth.rememberMe')}</span>
          </label>
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            {t('auth.forgotPassword')}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-yellow-400 text-black py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-300">
          {t('auth.noAccount')}{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-yellow-400 hover:text-yellow-300 transition-colors font-semibold"
          >
            {t('auth.signUp')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;