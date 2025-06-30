import React from 'react';
import { Gem, Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-black border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Gem className="h-8 w-8 text-yellow-400" />
              <span className="text-3xl font-bold text-white lunova-brand">Lunova</span>
            </div>
            <p className="text-gray-300">
              {t('footer.description')}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              <li><a href="#home" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('nav.home')}</a></li>
              <li><a href="#services" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('nav.services')}</a></li>
              <li><a href="#collections" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('nav.collections')}</a></li>
              <li><a href="#pricing" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('nav.pricing')}</a></li>
              <li><a href="#testimonials" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('nav.reviews')}</a></li>
              <li><a href="#contact" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('nav.contact')}</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.services')}</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('services.custom.title')}</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('services.restoration.title')}</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">{t('services.repair.title')}</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Appraisals</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Consultation</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Gift Cards</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.contactInfo')}</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-yellow-400 mt-0.5" />
                <span className="text-gray-300 text-sm">123 Nguyen Hue Street, District 1, Ho Chi Minh City, Vietnam</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-yellow-400" />
                <span className="text-gray-300 text-sm">+84 (28) 3823-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-yellow-400" />
                <span className="text-gray-300 text-sm">hoangnv.grinda@gmail.com</span>
              </div>
            </div>
            
            <div className="mt-6">
              <h5 className="text-white font-medium mb-2">{t('footer.newsletter')}</h5>
              <div className="flex">
                <input
                  type="email"
                  placeholder={t('footer.newsletterPlaceholder')}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-l-lg px-3 py-2 text-white text-sm focus:border-yellow-400 focus:outline-none"
                />
                <button className="bg-yellow-400 text-black px-4 py-2 rounded-r-lg hover:bg-yellow-300 transition-colors">
                  <Mail className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              {t('footer.copyright')}
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">{t('footer.privacy')}</a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">{t('footer.terms')}</a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">{t('footer.shipping')}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;