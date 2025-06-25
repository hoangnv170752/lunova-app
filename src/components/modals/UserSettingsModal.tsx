import React, { useState } from 'react';
import { useLanguage, Language } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  X, 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Moon, 
  Sun,
  Globe,
  LogOut,
  ChevronRight,
  Check
} from 'lucide-react';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const { t, changeLanguage, currentLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [darkMode, setDarkMode] = useState(true);

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: t('settings.general') || 'General', icon: Settings },
    { id: 'account', label: t('settings.account') || 'Account', icon: User },
    { id: 'notifications', label: t('settings.notifications') || 'Notifications', icon: Bell },
    { id: 'privacy', label: t('settings.privacy') || 'Privacy', icon: Shield },
    { id: 'appearance', label: t('settings.appearance') || 'Appearance', icon: Moon },
    { id: 'language', label: t('settings.language') || 'Language', icon: Globe },
  ];

  const languages = [
    { code: 'en' as Language, name: 'English' },
    { code: 'ja' as Language, name: '日本語' }
  ];

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode as Language);
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-white mb-4">{t('settings.general') || 'General Settings'}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">{t('settings.autoSave') || 'Auto-save changes'}</span>
                <div className="w-12 h-6 bg-gray-700 rounded-full p-1 flex items-center cursor-pointer">
                  <div className="bg-yellow-400 w-4 h-4 rounded-full transform translate-x-6"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">{t('settings.analytics') || 'Share analytics'}</span>
                <div className="w-12 h-6 bg-gray-700 rounded-full p-1 flex items-center cursor-pointer">
                  <div className="bg-gray-400 w-4 h-4 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'account':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-white mb-4">{t('settings.account') || 'Account Settings'}</h3>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-black" />
                </div>
                <div>
                  <h4 className="text-white font-medium">{user?.email?.split('@')[0] || 'User'}</h4>
                  <p className="text-gray-400 text-sm">{user?.email || 'user@example.com'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-300">{t('settings.changePassword') || 'Change Password'}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-300">{t('settings.twoFactor') || 'Two-factor Authentication'}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-300">{t('settings.connectedAccounts') || 'Connected Accounts'}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-white mb-4">{t('settings.notifications') || 'Notification Settings'}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">{t('settings.emailNotifications') || 'Email Notifications'}</span>
                <div className="w-12 h-6 bg-gray-700 rounded-full p-1 flex items-center cursor-pointer">
                  <div className="bg-yellow-400 w-4 h-4 rounded-full transform translate-x-6"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">{t('settings.pushNotifications') || 'Push Notifications'}</span>
                <div className="w-12 h-6 bg-gray-700 rounded-full p-1 flex items-center cursor-pointer">
                  <div className="bg-yellow-400 w-4 h-4 rounded-full transform translate-x-6"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">{t('settings.marketingEmails') || 'Marketing Emails'}</span>
                <div className="w-12 h-6 bg-gray-700 rounded-full p-1 flex items-center cursor-pointer">
                  <div className="bg-gray-400 w-4 h-4 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-white mb-4">{t('settings.privacy') || 'Privacy Settings'}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">{t('settings.dataSaving') || 'Data Saving'}</span>
                <div className="w-12 h-6 bg-gray-700 rounded-full p-1 flex items-center cursor-pointer">
                  <div className="bg-yellow-400 w-4 h-4 rounded-full transform translate-x-6"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">{t('settings.cookies') || 'Cookie Preferences'}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">{t('settings.dataExport') || 'Export Your Data'}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-white mb-4">{t('settings.appearance') || 'Appearance'}</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">{t('settings.darkMode') || 'Dark Mode'}</span>
                <div 
                  className="w-12 h-6 bg-gray-700 rounded-full p-1 flex items-center cursor-pointer"
                  onClick={handleDarkModeToggle}
                >
                  <div className={`w-4 h-4 rounded-full transform ${darkMode ? 'bg-yellow-400 translate-x-6' : 'bg-gray-400'}`}></div>
                </div>
              </div>
              <div>
                <span className="text-gray-300 block mb-2">{t('settings.theme') || 'Theme'}</span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-20 bg-gray-800 rounded-lg border-2 border-yellow-400 flex items-center justify-center">
                    <Moon className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="h-20 bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center">
                    <Sun className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="h-20 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg border border-gray-600 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'language':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-white mb-4">{t('settings.language') || 'Language'}</h3>
            <div className="space-y-2">
              {languages.map((lang) => (
                <div 
                  key={lang.code}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                    currentLanguage === lang.code ? 'bg-yellow-400/10 border border-yellow-400' : 'hover:bg-gray-800'
                  }`}
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  <span className={currentLanguage === lang.code ? 'text-yellow-400' : 'text-gray-300'}>{lang.name}</span>
                  {currentLanguage === lang.code && <Check className="h-4 w-4 text-yellow-400" />}
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-800"
        style={{ maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">{t('settings.title') || 'Settings'}</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Modal content */}
        <div className="flex h-[500px]">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-800">
            <nav className="p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        tab.id === activeTab
                          ? 'bg-yellow-400/10 text-yellow-400 border-r-2 border-yellow-400'
                          : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      <tab.icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            
            {/* Logout button */}
            <div className="p-4 mt-auto">
              <button
                onClick={logout}
                className="w-full flex items-center space-x-3 px-3 py-2 text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>{t('dashboard.logout') || 'Logout'}</span>
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsModal;
