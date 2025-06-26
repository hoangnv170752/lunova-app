import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LogOut, Package, Gem, Ticket, Store, LucideIcon } from 'lucide-react';
import chibiImage from '../../assets/chibi.png';
import chibi2Image from '../../assets/chibi2.png';

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  count?: number | null;
  route?: string;
}

interface DashboardSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  ticketCount?: number;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  ticketCount = 12
}) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [shopCount, setShopCount] = useState(0);
  const [productCount, setProductCount] = useState(0);

  // Fetch shop and product counts from API
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        
        // Fetch shops with owner filter if user is logged in
        let shopsUrl = `${baseUrl}/shops/`;
        if (user && user.id) {
          shopsUrl = `${baseUrl}/shops/?owner_id=${user.id}`;
        }
        
        const shopsResponse = await fetch(shopsUrl);
        if (shopsResponse.ok) {
          const shopsData = await shopsResponse.json();
          setShopCount(shopsData.length);
        }
        
        // Fetch products
        const productsUrl = `${baseUrl}/products/`;
        const productsResponse = await fetch(productsUrl);
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProductCount(productsData.length);
        }
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };
    
    fetchCounts();
  }, [user]);

  const sidebarItems: SidebarItem[] = [
    { id: 'orders', label: t('dashboard.recentOrders') || 'Recent Orders', icon: Package, count: 0, route: '/dashboard' },
    { id: 'products', label: t('nav.products') || 'Products', icon: Gem, count: productCount, route: '/dashboard/product' },
    { id: 'shops', label: t('nav.shops') || 'Shops', icon: Store, count: shopCount, route: '/dashboard/shop' },
    { id: 'tickets', label: t('nav.tickets') || 'Tickets', icon: Ticket, count: ticketCount, route: '/dashboard/ticket' },
  ];

  return (
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

      {/* Chibi decorations in fan shape */}
      <div className="px-6 py-3 flex justify-center space-x-2">
        {/* First chibi image */}
        <div className="relative">
          <img 
            src={chibiImage} 
            alt="Chibi character 1" 
            className="h-16 w-auto object-contain hover:scale-110 transition-transform"
            style={{ 
              filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.3))',
              animation: 'bounce 3s ease-in-out infinite',
              transform: 'rotate(-15deg)'
            }}
          />
        </div>
        
        {/* Second chibi image */}
        <div className="relative">
          <img 
            src={chibi2Image} 
            alt="Chibi character 2" 
            className="h-16 w-auto object-contain hover:scale-110 transition-transform"
            style={{ 
              filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.3))',
              animation: 'bounce 3s ease-in-out infinite 0.5s',
              transform: 'rotate(15deg)'
            }}
          />
        </div>
      </div>

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
                {item.count !== undefined && item.count !== null && (
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
          <span className="font-medium">{t('dashboard.logout') || 'Logout'}</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardSidebar;
