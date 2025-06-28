import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import UserSettingsModal from '../modals/UserSettingsModal';
import WeatherDisplay from '../WeatherDisplay';
import DashboardSidebar from './DashboardSidebar';
import { 
  Store, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  AlertCircle,
  Bell,
  Mail,
  Phone,
} from 'lucide-react';

interface SocialMedia {
  facebook: string;
  instagram: string;
  twitter: string;
  website: string;
}

interface Shop {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  banner_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city: string;
  state?: string;
  country: string;
  postal_code: string;
  social_media?: SocialMedia;
  owner_id: string;
  is_verified?: boolean;
  created_at?: string;
}

const ShopDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('shops');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    logo_url: string;
    banner_url: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    social_media: {
      facebook: string;
      instagram: string;
      twitter: string;
      website: string;
    };
  }>({
    name: '',
    description: '',
    logo_url: '',
    banner_url: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    social_media: {
      facebook: '',
      instagram: '',
      twitter: '',
      website: ''
    }
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);// Filter shops based on search query
  const filteredShops = shops.filter(shop => 
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // No longer need to pass shop count to sidebar as it fetches counts directly

  // Fetch shops from API
  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        // Replace with your actual API endpoint
        let url = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/shops/`;
        console.log(url)
        // If user is logged in and not an admin, only fetch their shops
        if (user && user.id) {
          url = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/shops/?owner_id=${user.id}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch shops');
        }
        
        const data = await response.json();
        setShops(data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching shops. Please try again later.');
        setLoading(false);
        console.error('Error fetching shops:', err);
      }
    };

    fetchShops();
  }, [user]);

  

  // Handle shop deletion
  const handleDeleteShop = async (shopId: string) => {
    if (window.confirm(t('dashboard.confirmDeleteShop') || 'Are you sure you want to delete this shop?')) {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/shops/${shopId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete shop');
        }

        // Remove shop from state
        setShops(shops.filter(shop => shop.id !== shopId));
      } catch (err) {
        setError(t('dashboard.errorDeletingShop') || 'Error deleting shop. Please try again later.');
        console.error('Error deleting shop:', err);
      }
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle nested social_media fields
    if (name.startsWith('social_media.')) {
      const socialField = name.split('.')[1] as keyof typeof formData.social_media;
      setFormData(prev => ({
        ...prev,
        social_media: {
          ...prev.social_media,
          [socialField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }) as typeof formData);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Add owner_id from logged in user
      const shopData = {
        ...formData,
        owner_id: user?.id
      };

      const url = editingShop 
        ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/shops/${editingShop.id}` 
        : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/shops/`;
      
      const method = editingShop ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shopData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingShop ? 'update' : 'create'} shop`);
      }

      const data = await response.json();
      
      if (editingShop) {
        // Update existing shop in state
        setShops(shops.map(shop => shop.id === data.id ? data : shop));
      } else {
        // Add new shop to state
        setShops([...shops, data]);
      }

      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        logo_url: '',
        banner_url: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        social_media: {
          facebook: '',
          instagram: '',
          twitter: '',
          website: ''
        }
      });
      setShowCreateModal(false);
      setEditingShop(null);
    } catch (err) {
      setError(t('dashboard.errorSavingShop') || 'Error saving shop. Please try again later.');
      console.error('Error saving shop:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set form data when editing a shop
  useEffect(() => {
    if (editingShop) {
      setFormData({
        name: editingShop.name || '',
        description: editingShop.description || '',
        logo_url: editingShop.logo_url || '',
        banner_url: editingShop.banner_url || '',
        contact_email: editingShop.contact_email || '',
        contact_phone: editingShop.contact_phone || '',
        address: editingShop.address || '',
        city: editingShop.city || '',
        state: editingShop.state || '',
        country: editingShop.country || '',
        postal_code: editingShop.postal_code || '',
        social_media: {
          facebook: editingShop.social_media?.facebook || '',
          instagram: editingShop.social_media?.instagram || '',
          twitter: editingShop.social_media?.twitter || '',
          website: editingShop.social_media?.website || ''
        }
      });
    }
  }, [editingShop]);

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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{t('dashboard.tickets.title') || 'Support Tickets'}</h1>
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

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Store className="mr-2" /> {t('dashboard.shops')}
            </h2>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 px-4 rounded-md flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" /> {t('dashboard.createShop')}
            </button>
          </div>

          {/* Search and filter */}
          <div className="mb-6 flex items-center">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg block w-full pl-10 p-2.5 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder={t('dashboard.searchShops')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="ml-2 bg-gray-800 hover:bg-gray-700 text-white py-2.5 px-4 rounded-lg flex items-center">
              <Filter className="h-4 w-4 mr-2" /> {t('dashboard.filter')}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto"></div>
              <p className="mt-3 text-gray-400">{t('dashboard.loading')}</p>
            </div>
          ) : (
            <>
              {/* Shops list */}
              {filteredShops.length === 0 ? (
                <div className="text-center py-10 bg-gray-900 rounded-lg">
                  <Store className="h-12 w-12 mx-auto text-gray-600" />
                  <h3 className="mt-2 text-xl font-medium text-white">{t('dashboard.noShopsFound')}</h3>
                  <p className="mt-1 text-gray-400">
                    {searchQuery 
                      ? t('dashboard.noShopsMatching') 
                      : t('dashboard.createYourFirstShop')}
                  </p>
                  {!searchQuery && (
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 px-4 rounded-md inline-flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" /> {t('dashboard.createShop')}
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs uppercase bg-gray-900 text-gray-400">
                      <tr>
                        <th scope="col" className="px-6 py-3">{t('dashboard.shopName')}</th>
                        <th scope="col" className="px-6 py-3">{t('dashboard.shopLocation')}</th>
                        <th scope="col" className="px-6 py-3">{t('dashboard.contactInformation')}</th>
                        <th scope="col" className="px-6 py-3">{t('dashboard.shopCreated')}</th>
                        <th scope="col" className="px-6 py-3">{t('dashboard.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShops.map((shop) => (
                        <tr key={shop.id} className="border-b border-gray-800 bg-gray-900 hover:bg-gray-800">
                          <td className="px-6 py-4 font-medium whitespace-nowrap text-white flex items-center">
                            {shop.logo_url ? (
                              <img src={shop.logo_url} alt={shop.name} className="w-8 h-8 rounded-full mr-3" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center mr-3">
                                <Store className="h-4 w-4 text-black" />
                              </div>
                            )}
                            {shop.name}
                          </td>
                          <td className="px-6 py-4">
                            {shop.city}, {shop.country}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              {shop.contact_email && (
                                <div className="flex items-center text-xs mb-1">
                                  <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                  <span className="text-gray-300">{shop.contact_email}</span>
                                </div>
                              )}
                              {shop.contact_phone && (
                                <div className="flex items-center text-xs">
                                  <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                  <span className="text-gray-300">{shop.contact_phone}</span>
                                </div>
                              )}
                              {!shop.contact_email && !shop.contact_phone && (
                                <span className="text-gray-500 text-xs italic">{t('dashboard.noContactInfo')}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-400 text-sm">
                              {t('dashboard.created') || 'Created'}: {shop.created_at ? new Date(shop.created_at).toLocaleDateString() : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => setEditingShop(shop)}
                                className="text-blue-500 hover:text-blue-400"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">{t('dashboard.editShop')}</span>
                              </button>
                              <button 
                                onClick={() => handleDeleteShop(shop.id)}
                                className="text-red-500 hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">{t('dashboard.deleteShop')}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Create/Edit Shop Modal */}
          {(showCreateModal || editingShop) && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900/90 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Modal Header - macOS style */}
                <div className="bg-gray-800/80 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setShowCreateModal(false);
                          setEditingShop(null);
                        }}
                        className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"
                      >
                        <span className="sr-only">Close</span>
                      </button>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <h2 className="text-lg font-medium text-white">
                    {editingShop ? t('dashboard.editShop') : t('dashboard.createShop')}
                  </h2>
                  <div className="w-16"></div> {/* Spacer for centering title */}
                </div>
                
                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-4 overflow-y-auto custom-scrollbar">
                  {error && (
                    <div className="mb-3 p-2 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-400 mb-3">
                    {editingShop ? t('dashboard.editShopDescription') : t('dashboard.createShopDescription')}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basic Information */}
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-200 mb-2">{t('dashboard.basicInformation')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.shopName')} *</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.shopDescription')} *</label>
                          <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            required
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Media */}
                    <div className="md:col-span-2 mt-2">
                      <h3 className="text-sm font-medium text-gray-200 mb-2">{t('dashboard.media')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.logoUrl')}</label>
                          <input
                            type="url"
                            name="logo_url"
                            value={formData.logo_url}
                            onChange={handleInputChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.bannerUrl')}</label>
                          <input
                            type="url"
                            name="banner_url"
                            value={formData.banner_url}
                            onChange={handleInputChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Contact Information */}
                    <div className="md:col-span-2 mt-2">
                      <h3 className="text-sm font-medium text-gray-200 mb-2">{t('dashboard.contactInformation')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.contactEmail')}</label>
                          <input
                            type="email"
                            name="contact_email"
                            value={formData.contact_email}
                            onChange={handleInputChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.phone')}</label>
                          <input
                            type="tel"
                            name="contact_phone"
                            value={formData.contact_phone}
                            onChange={handleInputChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Address */}
                    <div className="md:col-span-2 mt-2">
                      <h3 className="text-sm font-medium text-gray-200 mb-2">{t('dashboard.shopAddress')}</h3>
                      <div className="grid grid-cols-1 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.streetAddress')}</label>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.city')} *</label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.state')}</label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.country')} *</label>
                          <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            required
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.postalCode')} *</label>
                          <input
                            type="text"
                            name="postal_code"
                            value={formData.postal_code}
                            onChange={handleInputChange}
                            required
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Social Media */}
                    <div className="md:col-span-2 mt-2">
                      <h3 className="text-sm font-medium text-gray-200 mb-2">{t('dashboard.shopSocialMedia')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Facebook</label>
                          <input
                            type="url"
                            name="social_media.facebook"
                            value={formData.social_media.facebook}
                            onChange={handleInputChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Instagram</label>
                          <input
                            type="url"
                            name="social_media.instagram"
                            value={formData.social_media.instagram}
                            onChange={handleInputChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Twitter</label>
                          <input
                            type="url"
                            name="social_media.twitter"
                            value={formData.social_media.twitter}
                            onChange={handleInputChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.website')}</label>
                          <input
                            type="url"
                            name="social_media.website"
                            value={formData.social_media.website}
                            onChange={handleInputChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Form Actions */}
                  <div className="mt-8 flex justify-end space-x-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setEditingShop(null);
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      {t('dashboard.cancel') || 'Cancel'}
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors flex items-center"
                    >
                      {isSubmitting && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {editingShop 
                        ? (t('dashboard.saveChanges') || 'Save Changes') 
                        : (t('dashboard.createShop') || 'Create Shop')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopDashboard;
