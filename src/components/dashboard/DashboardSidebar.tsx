import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LogOut, Package, Gem, Ticket, Store, LucideIcon, X } from 'lucide-react';
import chibiImage from '../../assets/chibi.png';
import chibi2Image from '../../assets/chibi2.png';
import chibi3Image from '../../assets/chibi3.png';
import { gsap } from 'gsap';

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalImageRef = useRef<HTMLImageElement>(null);
  const modalOverlayRef = useRef<HTMLDivElement>(null);

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

  // GSAP animation for modal
  useEffect(() => {
    if (selectedImage) {
      // Animate modal overlay
      gsap.fromTo(
        modalOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      );
      
      // Animate modal
      gsap.fromTo(
        modalRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
      );
      
      // Animate image with blink effect
      gsap.fromTo(
        modalImageRef.current,
        { scale: 0.8, opacity: 0.5 },
        { 
          scale: 1, 
          opacity: 1, 
          duration: 0.7,
          ease: "elastic.out(1, 0.3)",
          onComplete: () => {
            // Add blink animation
            gsap.to(modalImageRef.current, {
              filter: "brightness(1.5)",
              duration: 0.2,
              repeat: 2,
              yoyo: true
            });
          }
        }
      );
    }
  }, [selectedImage]);

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
      <div className="px-6 py-3 flex justify-center">
        <div className="relative flex items-center justify-center" style={{ height: '120px', width: '180px' }}>
          {/* First chibi image */}
          <div 
            className="absolute cursor-pointer"
            style={{ 
              transform: 'rotate(-30deg) translateX(-40px)', 
              zIndex: 1 
            }}
          >
            <img 
              src={chibiImage} 
              alt="Chibi character 1" 
              className="h-16 w-auto object-contain hover:scale-110 transition-transform"
              style={{ 
                filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.3))',
                animation: 'bounce 3s ease-in-out infinite'
              }}
              onClick={() => setSelectedImage(chibiImage)}
            />
          </div>
          
          {/* Second chibi image - center */}
          <div 
            className="absolute cursor-pointer"
            style={{ 
              zIndex: 2 
            }}
          >
            <img 
              src={chibi2Image} 
              alt="Chibi character 2" 
              className="h-16 w-auto object-contain hover:scale-110 transition-transform"
              style={{ 
                filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.3))',
                animation: 'bounce 3s ease-in-out infinite 0.5s'
              }}
              onClick={() => setSelectedImage(chibi2Image)}
            />
          </div>

          {/* Third chibi image */}
          <div 
            className="absolute cursor-pointer"
            style={{ 
              transform: 'rotate(30deg) translateX(40px)', 
              zIndex: 1 
            }}
          >
            <img 
              src={chibi3Image} 
              alt="Chibi character 3" 
              className="h-16 w-auto object-contain hover:scale-110 transition-transform"
              style={{ 
                filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.3))',
                animation: 'bounce 3s ease-in-out infinite 0.3s'
              }}
              onClick={() => setSelectedImage(chibi3Image)}
            />
          </div>
        </div>
      </div>

      {/* Modal for displaying clicked image */}
      {selectedImage && (
        <div 
          ref={modalOverlayRef}
          className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            ref={modalRef}
            className="bg-gray-800 p-4 rounded-lg relative max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="absolute top-2 right-2 text-white hover:text-gray-300"
              onClick={() => setSelectedImage(null)}
            >
              <X size={24} />
            </button>
            <div className="flex justify-center">
              <img 
                ref={modalImageRef}
                src={selectedImage} 
                alt="Enlarged chibi character" 
                className="max-h-96 object-contain"
              />
            </div>
          </div>
        </div>
      )}

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
