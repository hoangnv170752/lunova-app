import React from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import WeatherDisplay from '../WeatherDisplay';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  onOpenSettings: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  onOpenSettings
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-gray-400 text-sm">{subtitle || t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-4">
          <WeatherDisplay />
          
          <button className="text-gray-400 hover:text-yellow-400 transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          <button 
            onClick={onOpenSettings}
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 transition-colors rounded-full p-1 pr-4"
          >
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-black font-medium">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
            <span className="text-sm text-gray-300">{user?.email?.split('@')[0] || 'User'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
