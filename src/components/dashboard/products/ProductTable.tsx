import React, { useState } from 'react';
import { Loader, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Product } from '../../../types/Product';
import ProductImageCarousel from './ProductImageCarousel';

interface ProductTableProps {
  loading: boolean;
  searchQuery: string;
  filteredProducts: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  selectedProduct: Product | null;
  onSelectProduct: (product: Product) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({
  loading,
  searchQuery,
  filteredProducts,
  onEdit,
  onDelete,
  selectedProduct,
  onSelectProduct
}) => {
  const { t } = useLanguage();
  const [showImageCarousel, setShowImageCarousel] = useState(false);
  const [carouselProductId, setCarouselProductId] = useState<string>('');
  const [carouselProductName, setCarouselProductName] = useState<string>('');
  
  const handleViewImages = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Prevent row selection
    setCarouselProductId(product.id);
    setCarouselProductName(product.name);
    setShowImageCarousel(true);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
        <thead className="bg-gray-800/50 border-y border-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t('dashboard.products.productName') || 'Product Name'}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t('dashboard.products.category') || 'Category'}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t('dashboard.products.price') || 'Price'}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t('dashboard.products.stock') || 'Stock'}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t('dashboard.products.status') || 'Status'}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t('dashboard.actions') || 'Actions'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                <div className="flex justify-center items-center space-x-2">
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>{t('dashboard.loading') || 'Loading...'}</span>
                </div>
              </td>
            </tr>
          ) : filteredProducts.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                {searchQuery ? (
                  <>{t('dashboard.products.noProductsFound') || 'No products found matching your search.'}</>
                ) : (
                  <>{t('dashboard.products.noProducts') || 'No products available. Create your first product!'}</>
                )}
              </td>
            </tr>
          ) : (
            filteredProducts.map((product) => (
              <tr 
                key={product.id} 
                className={`hover:bg-gray-800/30 cursor-pointer ${selectedProduct?.id === product.id ? 'bg-gray-800/50 border-l-4 border-yellow-500' : ''}`}
                onClick={() => onSelectProduct(product)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded bg-gray-700 flex items-center justify-center text-xs">
                      {product.name.substring(0, 2)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">{product.name}</div>
                      <div className="text-xs text-gray-400">ID: {product.id.substring(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{product.category}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">${parseFloat(product.price.toString()).toFixed(2)}</div>
                  {product.is_on_sale && product.sale_price && (
                    <div className="text-xs text-yellow-400">Sale: ${parseFloat(product.sale_price.toString()).toFixed(2)}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{product.stock_quantity}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.stock_quantity > 10 ? 'bg-green-100 text-green-800' : 
                    product.stock_quantity > 0 ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {product.stock_quantity > 10 ? t('dashboard.products.inStock') || 'In Stock' : 
                     product.stock_quantity > 0 ? t('dashboard.products.lowStock') || 'Low Stock' : 
                     t('dashboard.products.outOfStock') || 'Out of Stock'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={(e) => handleViewImages(e, product)}
                      className="p-1 rounded-md hover:bg-gray-700 hover:text-yellow-500 transition-colors"
                    >
                      <Eye className="h-4 w-4 text-gray-400 hover:text-yellow-400" />
                    </button>
                    <button 
                      onClick={() => onEdit(product)}
                      className="p-1 rounded-md hover:bg-gray-700"
                    >
                      <Edit className="h-4 w-4 text-gray-400" />
                    </button>
                    <button 
                      onClick={() => onDelete(product.id)}
                      className="p-1 rounded-md hover:bg-gray-700"
                    >
                      <Trash2 className="h-4 w-4 text-gray-400" />
                    </button>
                    <button className="p-1 rounded-md hover:bg-gray-700">
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
        </table>
      </div>
      
      {/* Product Image Carousel Modal */}
      <ProductImageCarousel 
        isOpen={showImageCarousel}
        onClose={() => setShowImageCarousel(false)}
        productId={carouselProductId}
        productName={carouselProductName}
      />
    </>  
  );
};

export default ProductTable;
