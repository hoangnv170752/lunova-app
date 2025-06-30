import React from 'react';
import { Search, ChevronDown, Filter, Plus } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface Shop {
  id: string;
  name: string;
}

interface ProductHeaderProps {
  productCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedShopId: string;
  setSelectedShopId: (shopId: string) => void;
  shops: Shop[];
  onAddProduct: () => void;
}

const ProductHeader: React.FC<ProductHeaderProps> = ({
  productCount,
  searchQuery,
  setSearchQuery,
  selectedShopId,
  setSelectedShopId,
  shops,
  onAddProduct
}) => {
  const { t } = useLanguage();

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{t('dashboard.products.title') || 'Products'}</h2>
          <span className="text-sm text-gray-400">{productCount} {t('dashboard.products.items') || 'items'}</span>
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
            {/* Shop Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white appearance-none pr-8"
              >
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white flex items-center gap-2">
              <span className="text-sm text-gray-300">{t('dashboard.sortingBy') || 'Sorting By'}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white flex items-center gap-2">
              <span className="text-sm text-gray-300">{t('dashboard.filters') || 'Filters'}</span>
              <Filter className="h-4 w-4 text-gray-400" />
            </button>
            <button 
              onClick={onAddProduct}
              className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 rounded-lg text-sm text-black flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>{t('dashboard.products.addProduct') || 'Add Product'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductHeader;
