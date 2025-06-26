import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import UserSettingsModal from './modals/UserSettingsModal';
import WeatherDisplay from './WeatherDisplay';
import DashboardSidebar from './dashboard/DashboardSidebar';
import { 
  Bell,
  TrendingUp,
  TrendingDown,
  User,
  MoreHorizontal,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('users');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shopCount, setShopCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [, setIsLoading] = useState(true);
  // const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    const fetchCounts = async () => {
      setIsLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        let shopsUrl = `${baseUrl}/shops/`;
        if (user && user.id) {
          shopsUrl = `${baseUrl}/shops/?owner_id=${user.id}`;
        }
        
        const shopsResponse = await fetch(shopsUrl);
        if (shopsResponse.ok) {
          const shopsData = await shopsResponse.json();
          setShopCount(shopsData.length);
        }
        
        const productsUrl = `${baseUrl}/products/`;
        const productsResponse = await fetch(productsUrl);
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProductCount(productsData.length);
        }
      } catch (error) {
        console.error('Error fetching counts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCounts();
  }, [user]);

  const stats = [
    {
      title: t('nav.shops') || 'Shops',
      value: shopCount.toString(),
      change: '',
      changeType: 'neutral',
      subtitle: t('dashboard.totalShops') || 'total shops',
      icon: '🏪'
    },
    {
      title: t('nav.products') || 'Products',
      value: productCount.toString(),
      change: '',
      changeType: 'neutral',
      subtitle: t('dashboard.totalProducts') || 'total products',
      icon: '📦'
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

  const users = [
    { name: 'Floyd Miles', email: 'tanya.hill@example.com', city: 'Omsk', date: '7/11/19' },
    { name: 'Kristin Watson', email: 'curtis.weaver@example.com', city: 'Neftchik', date: '4/4/18' },
    { name: 'Annette Black', email: 'deanna.curtis@example.com', city: 'Khabarovsk', date: '3/4/16' },
    { name: 'Wade Warren', email: 'felicia.reid@example.com', city: 'Mannheim', date: '4/21/12' },
    { name: 'Esther Howard', email: 'dolores.chambers@example.com', city: 'Cincinnati (OH)', date: '12/4/17' },
    { name: 'Cameron Williamson', email: 'michael.mitc@example.com', city: 'Sterlitamak', date: '8/30/14' },
    { name: 'Albert Flores', email: 'sara.cruz@example.com', city: 'Lomas de Zamora', date: '8/15/17' },
    { name: 'Robert Fox', email: 'kenzi.lawson@example.com', city: 'Greensboro (NC)', date: '5/30/14' },
    { name: 'Jenny Wilson', email: 'jackson.graham@example.com', city: 'Lübeck', date: '5/27/15' },
    { name: 'Ralph Edwards', email: 'willie.jennings@example.com', city: 'Vladikavkaz (Ossetia ASSR)', date: '1/31/14' },
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

          {/* User List */}
          <div className="bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-800">
            {/* Table Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-white">{t('nav.users') || 'Users'}</h2>
                  <span className="text-sm text-gray-400">1340 {t('dashboard.users') || 'users'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <input
                      type="text"
                      placeholder={t('dashboard.searchUsers') || 'Search users...'}
                      className="w-full pl-10 pr-4 py-2 text-sm text-white border border-gray-700 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors">
                    <span className="text-sm text-gray-300">{t('dashboard.sortingBy') || 'Sorting By'}</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{t('dashboard.filters') || 'Filters'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-800 text-gray-300 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('dashboard.userName') || 'User Name'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('dashboard.emailAddress') || 'Email Address'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('dashboard.city') || 'City'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('dashboard.createdAt') || 'Created at'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('dashboard.actions') || 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map((user) => (
                    <tr key={user.email} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative w-64 flex items-center">
                          <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 font-semibold">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                          <span className="text-sm font-medium text-white">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.city}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-gray-400 hover:text-yellow-400 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-yellow-400 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                  <span>{t('dashboard.previous') || 'Previous'}</span>
                </button>
                <div className="flex items-center space-x-2">
                  <button className="w-8 h-8 flex items-center justify-center text-sm text-gray-300 hover:bg-gray-800 rounded">
                    1
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center text-sm bg-yellow-400 text-black rounded">
                    2
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center text-sm text-gray-300 hover:bg-gray-800 rounded">
                    3
                  </button>
                </div>
                <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-yellow-400 transition-colors">
                  <span>{t('dashboard.next') || 'Next'}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;