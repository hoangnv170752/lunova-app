import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative">
      <button
        className="flex items-center space-x-2 text-gray-300 hover:text-yellow-400 transition-colors p-2 rounded-lg"
        onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}
      >
        <Globe className="h-5 w-5" />
        <span className="text-sm font-medium uppercase">{language}</span>
      </button>
    </div>
  );
};

export default LanguageToggle;