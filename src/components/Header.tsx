import React, { useState } from 'react';
import { Menu, X, Gem, ShoppingBag, User, LogIn, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import LanguageToggle from './LanguageToggle';
import WeatherDisplay from './WeatherDisplay';

interface HeaderProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ isMenuOpen, setIsMenuOpen }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Gem className="h-8 w-8 text-yellow-400" />
            <span className="text-3xl font-bold text-white lunova-brand">Lunova</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('nav.home')}</a>
            <a href="#services" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('nav.services')}</a>
            <a href="#collections" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('nav.collections')}</a>
            <a href="#pricing" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('nav.pricing')}</a>
            <a href="#testimonials" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('nav.reviews')}</a>
            <a href="#contact" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('nav.contact')}</a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <WeatherDisplay />
            <LanguageToggle />
            <button className="hidden md:flex items-center space-x-2 bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-300 transition-colors">
              <ShoppingBag className="h-4 w-4" />
              <span>{t('nav.shop')}</span>
            </button>
            
            {user ? (
              <Link to="/dashboard" className="hidden md:flex items-center space-x-2 text-gray-300 hover:text-yellow-400 transition-colors">
                <User className="h-5 w-5" />
                <span className="text-sm">{user.name || t('nav.account')}</span>
              </Link>
            ) : (
              <div className="hidden md:block relative">
                <button 
                  onClick={() => setAuthDropdownOpen(!authDropdownOpen)}
                  className="flex items-center space-x-1 bg-yellow-400/10 text-yellow-400 px-3 py-2 rounded hover:bg-yellow-400/20 transition-colors"
                >
                  <LogIn className="h-4 w-4 mr-1" />
                  <span>{t('auth.login')}</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </button>
                
                {authDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-50">
                    <Link 
                      to="/login" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-yellow-400"
                      onClick={() => setAuthDropdownOpen(false)}
                    >
                      {t('auth.login')}
                    </Link>
                    <Link 
                      to="/register" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-yellow-400"
                      onClick={() => setAuthDropdownOpen(false)}
                    >
                      {t('auth.signUp')}
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            <button 
              className="md:hidden p-2 text-gray-300 hover:text-yellow-400 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-gray-800">
            <nav className="flex flex-col space-y-4">
              <a href="#home" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('nav.home')}</a>
              <a href="#services" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('nav.services')}</a>
              <a href="#collections" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('nav.collections')}</a>
              <a href="#pricing" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('nav.pricing')}</a>
              <a href="#testimonials" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('nav.reviews')}</a>
              <a href="#contact" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('nav.contact')}</a>
              
              {user ? (
                <Link to="/dashboard" className="flex items-center space-x-2 text-yellow-400 hover:text-yellow-300 transition-colors">
                  <User className="h-5 w-5" />
                  <span>{t('dashboard.dashboard')}</span>
                </Link>
              ) : (
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex items-center justify-between text-yellow-400 mb-2">
                    <span className="font-medium">{t('auth.accountOptions')}</span>
                  </div>
                  <Link to="/login" className="flex items-center text-gray-300 hover:text-yellow-400 transition-colors py-2">
                    <LogIn className="h-4 w-4 mr-2" />
                    {t('auth.login')}
                  </Link>
                  <Link to="/register" className="flex items-center text-gray-300 hover:text-yellow-400 transition-colors py-2">
                    <User className="h-4 w-4 mr-2" />
                    {t('auth.signUp')}
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;