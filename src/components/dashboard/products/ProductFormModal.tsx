import React from 'react';
import { Loader } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Product, ProductFormData } from '../../../types/Product';

interface Shop {
  id: string;
  name: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  editingProduct: Product | null;
  shops: Shop[];
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  editingProduct,
  shops,
  isSubmitting,
  error,
  onSubmit
}) => {
  const { t } = useLanguage();

  // Handle input changes in the form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else if (name === 'price' || name === 'sale_price' || name === 'weight' || name === 'stock_quantity') {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/90 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header - macOS style */}
        <div className="bg-gray-800/80 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-2">
              <button 
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"
              >
                <span className="sr-only">Close</span>
              </button>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>
          <h2 className="text-lg font-medium text-white">
            {editingProduct ? t('dashboard.products.editProduct') || 'Edit Product' : t('dashboard.products.addProduct') || 'Add Product'}
          </h2>
          <div className="w-16"></div> {/* Spacer for centering title */}
        </div>
        
        {/* Modal Body */}
        <form onSubmit={onSubmit} className="p-4 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-3 p-2 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <p className="text-sm text-gray-400 mb-3">
            {editingProduct ? 
              t('dashboard.products.editProductDescription') || 'Update your product information below.' : 
              t('dashboard.products.createProductDescription') || 'Fill in the details to create a new product.'}
          </p>
          
          {/* Shop Selection */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-200 mb-2">{t('dashboard.products.selectShop') || 'Select Shop'} *</h3>
            <select
              name="shop_id"
              value={formData.shop_id}
              onChange={handleInputChange}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">{t('dashboard.products.selectShopPlaceholder') || 'Select a shop...'}</option>
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>{shop.name}</option>
              ))}
            </select>
          </div>
          
          {/* Basic Information */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-200 mb-2">{t('dashboard.basicInformation') || 'Basic Information'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.products.name') || 'Product Name'} *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.products.category') || 'Category'} *</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.products.description') || 'Description'} *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            ></textarea>
          </div>
          
          {/* Pricing */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-200 mb-2">{t('dashboard.products.pricing') || 'Pricing'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.products.price') || 'Price'} *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.products.salePrice') || 'Sale Price'}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    name="sale_price"
                    value={formData.sale_price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Details */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-200 mb-2">{t('dashboard.products.additionalDetails') || 'Additional Details'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.products.subcategory') || 'Subcategory'}</label>
                <input
                  type="text"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.products.material') || 'Material'}</label>
                <input
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
          </div>
          
          {/* Physical Attributes */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-200 mb-2">{t('dashboard.products.physicalAttributes') || 'Physical Attributes'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.products.weight') || 'Weight (g)'}</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.products.dimensions') || 'Dimensions'}</label>
                <input
                  type="text"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleInputChange}
                  placeholder="L x W x H"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
          </div>
          
          {/* Inventory */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-200 mb-2">{t('dashboard.products.inventory') || 'Inventory'}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('dashboard.products.stockQuantity') || 'Stock Quantity'} *</label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>
          
          {/* Product Flags */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-200 mb-2">{t('dashboard.products.productFlags') || 'Product Flags'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_featured"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-700 rounded"
                />
                <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-300">
                  {t('dashboard.products.isFeatured') || 'Featured'}
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_new"
                  name="is_new"
                  checked={formData.is_new}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-700 rounded"
                />
                <label htmlFor="is_new" className="ml-2 block text-sm text-gray-300">
                  {t('dashboard.products.isNew') || 'New'}
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_on_sale"
                  name="is_on_sale"
                  checked={formData.is_on_sale}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-700 rounded"
                />
                <label htmlFor="is_on_sale" className="ml-2 block text-sm text-gray-300">
                  {t('dashboard.products.isOnSale') || 'On Sale'}
                </label>
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300"
            >
              {t('dashboard.cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 rounded-lg text-sm text-black flex items-center"
            >
              {isSubmitting && <Loader className="h-3 w-3 mr-2 animate-spin" />}
              {editingProduct ? t('dashboard.update') || 'Update' : t('dashboard.create') || 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
