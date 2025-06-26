import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import UserSettingsModal from './modals/UserSettingsModal';
import WeatherDisplay from './WeatherDisplay';
import DashboardSidebar from './dashboard/DashboardSidebar';
import MarketInsights from './dashboard/MarketInsights';
import { 
  Bell,
  TrendingUp,
  TrendingDown,
  Store,
  ShoppingBag
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('users');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const stats = [
    {
      title: t('nav.shops') || 'Shops',
      value: '5', // Static placeholder, actual count is managed by sidebar
      change: '',
      changeType: 'neutral',
      subtitle: t('dashboard.totalShops') || 'total shops',
      icon: <Store className="h-5 w-5 text-white" />
    },
    {
      title: t('nav.products') || 'Products',
      value: '24', // Static placeholder, actual count is managed by sidebar
      change: '+12.5%',
      changeType: 'positive',
      subtitle: t('dashboard.totalProducts') || 'total products',
      icon: <ShoppingBag className="h-5 w-5 text-white" />
    },
    {
      title: t('dashboard.recentOrders') || 'Orders',
      value: '89',
      change: '',
      changeType: 'neutral',
      subtitle: t('dashboard.stats.comparedTo') || 'compared to last month',
      icon: '📊'
    }
  ];

  return (
    <div className="min-h-screen bg-black flex">
      {isSettingsModalOpen && (
        <UserSettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={() => setIsSettingsModalOpen(false)} 
        />
      )}
      {/* Sidebar */}
      <DashboardSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{t('Dashboard') || 'Dashboard'}</h1>
              <p className="text-gray-400 text-sm">{t('dashboard.subtitle') || 'Welcome to your dashboard'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <WeatherDisplay />
              
              <button className="text-gray-400 hover:text-yellow-400 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setIsSettingsModalOpen(true)}
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

        {/* Stats Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-gray-400 mb-4">{stat.title}</div>
                    <div className="text-4xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium flex items-center ${
                        stat.changeType === 'positive' ? 'text-yellow-400' : 'text-yellow-400/70'
                      }`}>
                        {stat.changeType === 'positive' ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {stat.change}
                      </span>
                      <div className="text-xs text-gray-400">{stat.subtitle}</div>
                    </div>
                  </div>
                  <div className="text-2xl">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Market Insights */}
          <div className="bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-800">
            <MarketInsights />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;