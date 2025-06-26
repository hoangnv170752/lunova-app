import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserSettingsModal from '../modals/UserSettingsModal';
import WeatherDisplay from '../WeatherDisplay';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Eye,
  LogOut,
  Package,
  Gem,
  Ticket,
  Bell,
  Store
} from 'lucide-react';

const ProductDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const sidebarItems = [
    { id: 'orders', label: t('dashboard.recentOrders'), icon: Package, count: 89, route: '/dashboard' },
    { id: 'products', label: t('nav.products') || 'Products', icon: Gem, count: 156, route: '/dashboard/product' },
    { id: 'shops', label: t('nav.shops') || 'Shops', icon: Store, count: 0, route: '/dashboard/shop' },
    { id: 'tickets', label: t('nav.tickets') || 'Tickets', icon: Ticket, count: 12, route: '/dashboard/ticket' },
  ];

  // Sample product data
  const products = [
    { id: 1, name: 'Diamond Ring', category: 'Rings', price: '$1,299.99', stock: 12, status: 'Active' },
    { id: 2, name: 'Gold Bracelet', category: 'Bracelets', price: '$899.99', stock: 8, status: 'Active' },
    { id: 3, name: 'Pearl Necklace', category: 'Necklaces', price: '$599.99', stock: 15, status: 'Active' },
    { id: 4, name: 'Silver Earrings', category: 'Earrings', price: '$199.99', stock: 24, status: 'Active' },
    { id: 5, name: 'Platinum Watch', category: 'Watches', price: '$2,499.99', stock: 5, status: 'Active' },
    { id: 6, name: 'Sapphire Pendant', category: 'Pendants', price: '$799.99', stock: 7, status: 'Active' },
    { id: 7, name: 'Ruby Earrings', category: 'Earrings', price: '$899.99', stock: 9, status: 'Active' },
    { id: 8, name: 'Emerald Ring', category: 'Rings', price: '$1,499.99', stock: 3, status: 'Low Stock' },
    { id: 9, name: 'Gold Chain', category: 'Necklaces', price: '$699.99', stock: 0, status: 'Out of Stock' },
    { id: 10, name: 'Diamond Bracelet', category: 'Bracelets', price: '$1,899.99', stock: 2, status: 'Low Stock' },
  ];

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {isSettingsModalOpen && (
        <UserSettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={() => setIsSettingsModalOpen(false)} 
        />
      )}
      {/* Sidebar */}
      <div className="w-64 flex flex-col bg-gray-900 border-r border-gray-800">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
              <Gem className="h-5 w-5 text-black" />
            </div>
            <span className="text-xl font-bold text-white lunova-brand">Lunova</span>
          </div>
        </div>

        {/* No Weather Widget in sidebar */}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.route) {
                      navigate(item.route);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    item.id === activeTab
                      ? 'bg-yellow-400/10 text-yellow-400 border-r-2 border-yellow-400'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.count && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.id === activeTab ? 'bg-yellow-400/20 text-yellow-400' : 'bg-gray-800 text-gray-300'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">{t('dashboard.logout')}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{t('dashboard.products.title') || 'Products'}</h1>
              <p className="text-gray-400 text-sm">{t('dashboard.subtitle')}</p>
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

        {/* Product Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">{t('dashboard.products.title') || 'Products'}</h2>
              <span className="text-sm text-gray-400">{products.length} {t('dashboard.products.items') || 'items'}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-500"
                  placeholder={t('dashboard.products.searchProducts') || 'Search products...'}
                />
              </div>
              <div className="flex gap-3">
                <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white flex items-center gap-2">
                  <span className="text-sm text-gray-300">{t('dashboard.sortingBy') || 'Sorting By'}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white flex items-center gap-2">
                  <span className="text-sm text-gray-300">{t('dashboard.filters') || 'Filters'}</span>
                  <Filter className="h-4 w-4 text-gray-400" />
                </button>
                <button className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 rounded-lg text-sm text-black flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>{t('dashboard.products.addProduct') || 'Add Product'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-y border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('dashboard.products.productName') || 'Product Name'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('dashboard.products.category') || 'Category'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('dashboard.products.price') || 'Price'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('dashboard.products.stock') || 'Stock'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('dashboard.products.status') || 'Status'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('dashboard.actions') || 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-800/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded bg-gray-700 flex items-center justify-center text-xs">
                        {product.name.substring(0, 2)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{product.name}</div>
                        <div className="text-xs text-gray-400">ID: {product.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{product.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{product.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{product.stock}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.status === 'Active' ? 'bg-green-100 text-green-800' : 
                      product.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button className="p-1 rounded-md hover:bg-gray-700">
                        <Eye className="h-4 w-4 text-gray-400" />
                      </button>
                      <button className="p-1 rounded-md hover:bg-gray-700">
                        <Edit className="h-4 w-4 text-gray-400" />
                      </button>
                      <button className="p-1 rounded-md hover:bg-gray-700">
                        <Trash2 className="h-4 w-4 text-gray-400" />
                      </button>
                      <button className="p-1 rounded-md hover:bg-gray-700">
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-800">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700">
              {t('dashboard.previous') || 'Previous'}
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700">
              {t('dashboard.next') || 'Next'}
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-400">
                {t('dashboard.products.showing') || 'Showing'} <span className="font-medium">1</span> {t('dashboard.products.to') || 'to'} <span className="font-medium">10</span> {t('dashboard.products.of') || 'of'} <span className="font-medium">10</span> {t('dashboard.products.results') || 'results'}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700">
                  <span className="sr-only">{t('dashboard.previous') || 'Previous'}</span>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700">
                  1
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-700 bg-yellow-400 text-sm font-medium text-black">
                  2
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700">
                  3
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700">
                  <span className="sr-only">{t('dashboard.next') || 'Next'}</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDashboard;
