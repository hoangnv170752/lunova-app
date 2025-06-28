import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const MobileWarning: React.FC = () => {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  // Always show the mobile warning on this page

  // This component is only shown when the user is on a mobile device or small screen

  const handleLogout = async () => {
    await logout();
    navigate('/landing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400 mb-4">
            {t('mobile.notSupported') || 'Mobile Not Supported'}
          </h1>
          
          <div className="mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-yellow-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            
            <p className="text-lg mb-4">
              {t('mobile.notSupportedMessage') || 'Lunova dashboard is not optimized for mobile devices. Please use a desktop or tablet in landscape mode.'}
            </p>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            {t('auth.logout') || 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileWarning;
