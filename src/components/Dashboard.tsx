import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
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
  
  // State for stats data
  const [shopCount, setShopCount] = useState<number>(0);
  const [productCount, setProductCount] = useState<number>(0);
  const [ticketCount, setTicketCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  
  const statsContainerRef = useRef<HTMLDivElement>(null);
  const statsRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Fetch stats data
  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      
      // Fetch shop count - filter by owner_id
      const shopResponse = await fetch(`${baseUrl}/shops/count/?owner_id=${user.id}`);
      if (shopResponse.ok) {
        const shopData = await shopResponse.json();
        setShopCount(shopData.count || 0);
      }
      
      // Fetch product count - filter by user's shops
      const productResponse = await fetch(`${baseUrl}/products/count/?user_id=${user.id}`);
      if (productResponse.ok) {
        const productData = await productResponse.json();
        setProductCount(productData.count || 0);
      }
      
      // Fetch ticket count - filter by user_id
      const ticketResponse = await fetch(`${baseUrl}/tickets/count/?user_id=${user.id}`);
      if (ticketResponse.ok) {
        const ticketData = await ticketResponse.json();
        setTicketCount(ticketData.count || 0);
      }
    } catch (error) {
      console.error('Error fetching stats data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);
  
  // Fetch data when component mounts
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  
  // GSAP animations
  useEffect(() => {
    // Wait for stats to be loaded and refs to be ready
    if (loading) return;
    
    // Reset refs array
    statsRefs.current = [];
    
    // Wait a bit for refs to be populated after render
    const timer = setTimeout(() => {
      console.log('Animation refs ready:', statsRefs.current.length);
      if (statsContainerRef.current && statsRefs.current.length > 0) {
        // Set initial state for stats cards
        gsap.set(statsRefs.current, {
          y: 50,
          opacity: 0,
          scale: 0.9,
          rotationX: 10
        });
        
        const tl = gsap.timeline();
      
        tl.to(statsRefs.current, {
          y: 0,
          opacity: 1,
          scale: 1,
          rotationX: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "back.out(1.7)",
          delay: 0.3,
          clearProps: "rotationX"
        });
        
        tl.to(statsRefs.current, {
          y: "-=5",
          duration: 0.3,
          stagger: 0.1,
          ease: "power1.out"
        });
        
        tl.to(statsRefs.current, {
          y: 0,
          duration: 0.2,
          stagger: 0.1,
          ease: "power1.in"
        });
      
        statsRefs.current.forEach((card) => {
          if (!card) return;
          
          card.addEventListener('mouseenter', () => {
            gsap.to(card, {
              scale: 1.03,
              y: -5,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
              duration: 0.3,
              ease: "power2.out"
            });
            
            const icon = card.querySelector('.stat-icon');
            if (icon) {
              gsap.to(icon, {
                scale: 1.2,
                rotate: 5,
                duration: 0.4,
                ease: "elastic.out(1, 0.3)"
              });
            }
            
            const value = card.querySelector('.stat-value');
            if (value) {
              gsap.to(value, {
                scale: 1.05,
                color: "#ffd700",
                duration: 0.3
              });
            }
          });
          
          card.addEventListener('mouseleave', () => {
            gsap.to(card, {
              scale: 1,
              y: 0,
              boxShadow: "none",
              duration: 1.0,
              ease: "power2.out"
            });
            
            const icon = card.querySelector('.stat-icon');
            if (icon) {
              gsap.to(icon, {
                scale: 1,
                rotate: 0,
                duration: 0.3
              });
            }
            
            const value = card.querySelector('.stat-value');
            if (value) {
              gsap.to(value, {
                scale: 1,
                color: "#ffffff",
                duration: 0.3
              });
            }
          });
        });
      }
    }, 100); // Small delay to ensure refs are populated
    
    return () => {
      clearTimeout(timer);
      statsRefs.current.forEach((card) => {
        if (!card) return;
        card.replaceWith(card.cloneNode(true));
      });
    };
  }, [loading]);

  const stats = [
    {
      title: t('nav.shops') || 'Shops',
      value: loading ? '...' : shopCount.toString(),
      change: '',
      changeType: 'neutral',
      subtitle: t('dashboard.totalShops') || 'total shops',
      icon: <Store className="h-5 w-5 text-white" />
    },
    {
      title: t('nav.products') || 'Products',
      value: loading ? '...' : productCount.toString(),
      change: '+12.5%',
      changeType: 'positive',
      subtitle: t('dashboard.totalProducts') || 'total products',
      icon: <ShoppingBag className="h-5 w-5 text-white" />
    },
    {
      title: t('dashboard.recentOrders') || 'Tickets',
      value: loading ? '...' : ticketCount.toString(),
      change: '',
      changeType: 'neutral',
      subtitle: t('dashboard.stats.comparedTo') || 'compared to last month',
      icon: '🎫'
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
          <div ref={statsContainerRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                ref={el => statsRefs.current[index] = el}
                className="bg-gray-900 rounded-xl p-6 border border-gray-800 overflow-hidden relative"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-gray-400 mb-4">{stat.title}</div>
                    <div className="text-4xl font-bold text-white mb-1 stat-value">{stat.value}</div>
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
                  <div className="text-2xl stat-icon">{stat.icon}</div>
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