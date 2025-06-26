
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { gsap } from 'gsap';
import { Sparkles, TrendingUp, DollarSign, Users, Award, AlertCircle } from 'lucide-react';

interface MarketInsight {
  market_size: string;
  growth_rate: string;
  average_price: string;
  price_trend: string;
  key_players: string[];
  recent_developments: string[];
  consumer_insights: string[];
}

interface InsightResponse {
  insights: MarketInsight;
  sources: unknown[];
}

const MarketInsights: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [category, setCategory] = useState<string>('jewelry');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<MarketInsight | null>(null);
  // Fixed categories for now, could be fetched from API later
  const categories = [
    'jewelry', 'gasoline', 'electronics', 'fashion', 'home decor'
  ];
  
  // Category translations
  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'jewelry':
        return t('dashboard.marketInsights.categories.jewelry') || 'Jewelry';
      case 'gasoline':
        return t('dashboard.marketInsights.categories.gasoline') || 'Gasoline';
      case 'electronics':
        return t('dashboard.marketInsights.categories.electronics') || 'Electronics';
      case 'fashion':
        return t('dashboard.marketInsights.categories.fashion') || 'Fashion';
      case 'home decor':
        return t('dashboard.marketInsights.categories.homeDecor') || 'Home Decor';
      default:
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };
  
  // Refs for GSAP animations
  const insightCardRef = useRef<HTMLDivElement>(null);
  const marketSizeRef = useRef<HTMLDivElement>(null);
  const growthRateRef = useRef<HTMLDivElement>(null);
  const keyPlayersRef = useRef<HTMLDivElement>(null);
  const developmentsRef = useRef<HTMLDivElement>(null);
  const consumerInsightsRef = useRef<HTMLDivElement>(null);
  
  // Animation function
  const animateInsights = () => {
    // Only animate elements that exist
    const elementsToAnimate = [
      marketSizeRef.current, 
      growthRateRef.current, 
      keyPlayersRef.current,
      developmentsRef.current,
      consumerInsightsRef.current
    ].filter(Boolean); // Filter out any null/undefined refs
    
    if (elementsToAnimate.length === 0 || !insightCardRef.current) {
      return; // Don't animate if elements aren't ready
    }
    
    // Reset any existing animations
    gsap.set(elementsToAnimate, { opacity: 0, y: 20 });
    
    // Create a timeline for staggered animations
    const tl = gsap.timeline();
    
    // Main card animation
    tl.from(insightCardRef.current, { 
      duration: 0.8, 
      opacity: 0, 
      y: 30, 
      ease: "power3.out" 
    });
    
    // Staggered animations for each section
    tl.to(elementsToAnimate, { 
      duration: 0.6, 
      opacity: 1, 
      y: 0, 
      stagger: 0.15,
      ease: "power2.out" 
    }, "-=0.4");
  };
  
  const fetchInsights = React.useCallback(async (selectedCategory: string) => {
    // Don't fetch if we already have insights for this category and we're not explicitly refreshing
    if (insights && category === selectedCategory && !loading) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/market-insights/market-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: selectedCategory,
          specific_query: '',
          region: 'global'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json() as InsightResponse;
      console.log(data.insights);
      setInsights(data.insights);
      
      // Save to local storage
      try {
        const storageKey = `market_insights_${user?.id}_${selectedCategory}`;
        const storageData = {
          insights: data.insights,
          timestamp: new Date().getTime()
        };
        localStorage.setItem(storageKey, JSON.stringify(storageData));
        console.log('Market insights saved to local storage');
      } catch (error) {
        console.error('Error saving to local storage:', error);
      }
      
      // Wait for next render cycle before animating
      setTimeout(() => {
        if (document.body.contains(insightCardRef.current)) {
          animateInsights();
        }
      }, 100);
    } catch (err) {
      console.error('Error fetching market insights:', err);
      setError('Failed to load market insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [category, insights, loading, user?.id]);  // Add dependencies to prevent unnecessary fetches
  
  // Handle category change
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    fetchInsights(newCategory);
  };
  
  // Track if component is mounted
  const isMounted = useRef(false);
  
  // Load insights from local storage on mount
  useEffect(() => {
    const loadFromLocalStorage = () => {
      try {
        // Create a unique key based on user ID and category
        const storageKey = `market_insights_${user?.id}_${category}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const storedTimestamp = parsedData.timestamp;
          const currentTime = new Date().getTime();
          
          // Check if data is less than 24 hours old
          if (currentTime - storedTimestamp < 24 * 60 * 60 * 1000) {
            console.log('Loading market insights from local storage');
            setInsights(parsedData.insights);
            
            // Animate after a short delay to ensure DOM is ready
            setTimeout(() => {
              if (document.body.contains(insightCardRef.current)) {
                animateInsights();
              }
            }, 100);
            
            return true; // Data was loaded from storage
          }
        }
        return false; // No valid data in storage
      } catch (error) {
        console.error('Error loading from local storage:', error);
        return false;
      }
    };
    
    // Only fetch on first mount or if local storage doesn't have valid data
    if (!isMounted.current) {
      const loadedFromStorage = loadFromLocalStorage();
      if (!loadedFromStorage) {
        fetchInsights(category);
      }
      isMounted.current = true;
    }
  }, [fetchInsights, category, user?.id]);
  
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden" ref={insightCardRef}>
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">
              {t('dashboard.marketInsights') || 'Market Insights'}
            </h2>
          </div>
          
          <div className="flex space-x-2">
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-md text-gray-300 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-yellow-400"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => fetchInsights(category)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md px-3 py-2 text-sm transition-colors"
              disabled={loading}
            >
              {loading ? t('common.loading') || 'Loading...' : t('common.refresh') || 'Refresh'}
            </button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
        </div>
      ) : error ? (
        <div className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-300">{error || t('dashboard.marketInsights.error') || 'Failed to load market insights. Please try again later.'}</p>
        </div>
      ) : insights ? (
        <div className="p-6 space-y-8">
          {/* Market Size and Growth Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" ref={marketSizeRef}>
            <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-md font-medium text-white">{t('dashboard.marketInsights.marketSize') || 'Market Size'}</h3>
              </div>
              <p className="text-2xl font-bold text-white">{insights.market_size}</p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700" ref={growthRateRef}>
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-md font-medium text-white">{t('dashboard.marketInsights.growthRate') || 'Growth Rate'}</h3>
              </div>
              <p className="text-2xl font-bold text-white">{insights.growth_rate}</p>
            </div>
          </div>
          
          {/* Key Players */}
          <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700" ref={keyPlayersRef}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Award className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-md font-medium text-white">{t('dashboard.marketInsights.keyPlayers') || 'Key Players'}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {insights.key_players.map((player, index) => (
                <div 
                  key={index} 
                  className="bg-gray-700/30 px-3 py-2 rounded-md text-sm text-gray-300"
                >
                  {player}
                </div>
              ))}
            </div>
          </div>
          
          {/* Recent Developments */}
          <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700" ref={developmentsRef}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Sparkles className="h-5 w-5 text-yellow-400" />
              </div>
              <h3 className="text-md font-medium text-white">{t('dashboard.marketInsights.recentDevelopments') || 'Recent Developments'}</h3>
            </div>
            <ul className="space-y-2">
              {insights.recent_developments.map((development, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span className="text-gray-300">{development}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Consumer Insights */}
          <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700" ref={consumerInsightsRef}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Users className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-md font-medium text-white">{t('dashboard.marketInsights.consumerInsights') || 'Consumer Insights'}</h3>
            </div>
            <ul className="space-y-2">
              {insights.consumer_insights.map((insight, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span className="text-gray-300">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Average Price and Price Trend */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-orange-400" />
                </div>
                <h3 className="text-md font-medium text-white">{t('dashboard.marketInsights.averagePrice') || 'Average Price'}</h3>
              </div>
              <p className="text-gray-300">{insights.average_price}</p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-teal-400" />
                </div>
                <h3 className="text-md font-medium text-white">{t('dashboard.marketInsights.priceTrend') || 'Price Trend'}</h3>
              </div>
              <p className="text-gray-300">{insights.price_trend}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center">
          <p className="text-gray-300">{t('dashboard.marketInsights.noInsights') || 'No insights available. Please select a category.'}</p>
        </div>
      )}
    </div>
  );
};

export default MarketInsights;
