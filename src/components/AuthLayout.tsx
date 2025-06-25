import React from 'react';
import { Gem } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageToggle from './LanguageToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title }) => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-gray-900 to-purple-900">
      {/* Header with logo and language toggle */}
      <header className="w-full p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/landing" className="flex items-center space-x-2">
            <Gem className="h-8 w-8 text-yellow-400" />
            <span className="text-2xl font-bold text-white lunova-brand">Lunova</span>
          </Link>
          <LanguageToggle />
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-black/60 backdrop-blur-md p-8 rounded-xl border border-gray-800 shadow-2xl">
            <h1 className="text-2xl font-bold text-center text-white mb-6">{title}</h1>
            {children}
          </div>
        </div>
      </main>
      
      {/* Decorative elements */}
      <div className="fixed top-20 left-20 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-20 right-20 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Footer */}
      <footer className="p-4 text-center text-gray-400 text-sm">
        <p>{t('footer.copyright')}</p>
      </footer>
    </div>
  );
};

export default AuthLayout;
