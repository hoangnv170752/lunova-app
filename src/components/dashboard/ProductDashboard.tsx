import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserSettingsModal from '../modals/UserSettingsModal';
import WeatherDisplay from '../WeatherDisplay';
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Filter,
  Gem,
  Loader,
  LogOut,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Ticket,
  Trash2,
  Store
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sale_price?: number;
  category: string;
  subcategory?: string;
  material?: string;
  weight?: number;
  dimensions?: string;
  stock_quantity: number;
  is_featured: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  product_metadata?: Record<string, unknown>;
  shop_id: string;
  created_at?: string;
  updated_at?: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  sale_price?: number;
  category: string;
  subcategory?: string;
  material?: string;
  weight?: number;
  dimensions?: string;
  stock_quantity: number;
  is_featured: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  product_metadata?: Record<string, unknown>;
  shop_id: string;
}

const ProductDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // Product state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shops, setShops] = useState<{id: string, name: string}[]>([]);
  
  // Form data for creating/editing products
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    sale_price: 0,
    category: '',
    subcategory: '',
    material: '',
    weight: 0,
    dimensions: '',
    stock_quantity: 0,
    is_featured: false,
    is_new: true,
    is_on_sale: false,
    product_metadata: {},
    shop_id: ''
  });
  
  const sidebarItems = [
    { id: 'orders', label: t('dashboard.recentOrders'), icon: Package, count: 89, route: '/dashboard' },
    { id: 'products', label: t('nav.products') || 'Products', icon: Gem, count: 156, route: '/dashboard/product' },
    { id: 'shops', label: t('nav.shops') || 'Shops', icon: Store, count: 0, route: '/dashboard/shop' },
    { id: 'tickets', label: t('nav.tickets') || 'Tickets', icon: Ticket, count: 12, route: '/dashboard/ticket' },
  ];

  // Fetch products and shops when component mounts
  useEffect(() => {
    // Temporarily disabled fetchProducts
    // const fetchProducts = async () => {
    //   try {
    //     setLoading(true);
    //     // Build URL with query parameters if shop_id is selected
    //     let url = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/products/`;
    //     if (selectedShopId) {
    //       url = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/products/?shop_id=${selectedShopId}`;
    //     }
    //     
    //     const response = await fetch(url);
    //     if (!response.ok) {
    //       throw new Error('Failed to fetch products');
    //     }
    //     const data = await response.json();
    //     setProducts(data);
    //   } catch (err: unknown) {
    //     setError(t('dashboard.errorFetchingProducts') || 'Error fetching products. Please try again later.');
    //     console.error('Error fetching products:', err);
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    const fetchShops = async () => {
      try {
        if (user?.id) {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/shops/?owner_id=${user.id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch shops');
          }
          const data = await response.json();
          setShops(data.map((shop: {id: string, name: string}) => ({ id: shop.id, name: shop.name })));
        }
      } catch (err) {
        console.error('Error fetching shops:', err);
      }
    };

    // Temporarily disabled fetchProducts call
    // fetchProducts();
    // Set loading to false since we're not fetching products
    setLoading(false);
    // Initialize with empty products array for testing
    setProducts([]);
    fetchShops();
  }, [user?.id, t, selectedShopId]);
  
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
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.shop_id) {
      setError(t('dashboard.selectShop') || 'Please select a shop for this product');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const productData = {
        ...formData,
        product_metadata: {}
      };
      
      const url = editingProduct 
        ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/products/${editingProduct.id}` 
        : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/products/`;
      
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingProduct ? 'update' : 'create'} product`);
      }

      const data = await response.json();
      
      if (editingProduct) {
        // Update existing product in state
        setProducts(products.map(product => product.id === data.id ? data : product));
      } else {
        // Add new product to state
        setProducts([...products, data]);
      }

      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        price: 0,
        sale_price: 0,
        category: '',
        subcategory: '',
        material: '',
        weight: 0,
        dimensions: '',
        stock_quantity: 0,
        is_featured: false,
        is_new: true,
        is_on_sale: false,
        product_metadata: {},
        shop_id: ''
      });
      setShowCreateModal(false);
      setEditingProduct(null);
    } catch (err) {
      setError(t('dashboard.errorSavingProduct') || 'Error saving product. Please try again later.');
      console.error('Error saving product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle product deletion
  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm(t('dashboard.confirmDeleteProduct') || 'Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/products/${productId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete product');
        }

        // Remove the deleted product from state
        setProducts(products.filter(product => product.id !== productId));
      } catch (err) {
        setError(t('dashboard.errorDeletingProduct') || 'Error deleting product. Please try again later.');
        console.error('Error deleting product:', err);
      }
    }
  };
  
  // Set form data when editing a product
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        price: editingProduct.price || 0,
        sale_price: editingProduct.sale_price || 0,
        category: editingProduct.category || '',
        subcategory: editingProduct.subcategory || '',
        material: editingProduct.material || '',
        weight: editingProduct.weight || 0,
        dimensions: editingProduct.dimensions || '',
        stock_quantity: editingProduct.stock_quantity || 0,
        is_featured: editingProduct.is_featured || false,
        is_new: editingProduct.is_new || true,
        is_on_sale: editingProduct.is_on_sale || false,
        product_metadata: editingProduct.product_metadata || {},
        shop_id: editingProduct.shop_id || ''
      });
    }
  }, [editingProduct]);
  
  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Create/Edit Product Modal */}
      {(showCreateModal || editingProduct) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/90 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            {/* Modal Header - macOS style */}
            <div className="bg-gray-800/80 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingProduct(null);
                      setError(null);
                      setFormData({
                        name: '',
                        description: '',
                        price: 0,
                        sale_price: 0,
                        category: '',
                        subcategory: '',
                        material: '',
                        weight: 0,
                        dimensions: '',
                        stock_quantity: 0,
                        is_featured: false,
                        is_new: true,
                        is_on_sale: false,
                        product_metadata: {},
                        shop_id: ''
                      });
                    }}
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
            <form onSubmit={handleSubmit} className="p-4">
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
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingProduct(null);
                  }}
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
      )}
      {isSettingsModalOpen && (
        <UserSettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={() => setIsSettingsModalOpen(false)} 
        />
      )}
      {/* Sidebar */}
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

        {/* No Weather Widget in sidebar */}

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
                  {item.count && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.id === activeTab ? 'bg-yellow-400/20 text-yellow-400' : 'bg-gray-800 text-gray-300'
                    }`}>
                      {item.count}
                    </span>
                  )}
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
            <span className="font-medium">{t('dashboard.logout')}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{t('dashboard.products.title') || 'Products'}</h1>
              <p className="text-gray-400 text-sm">{t('dashboard.subtitle')}</p>
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

        {/* Product Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">{t('dashboard.products.title') || 'Products'}</h2>
              <span className="text-sm text-gray-400">{products.length} {t('dashboard.products.items') || 'items'}</span>
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
                    <option value="">{t('dashboard.products.allShops') || 'All Shops'}</option>
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
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 rounded-lg text-sm text-black flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>{t('dashboard.products.addProduct') || 'Add Product'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

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
                  <tr key={product.id} className="hover:bg-gray-800/30">
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
                      <div className="text-sm text-gray-300">${product.price.toFixed(2)}</div>
                      {product.is_on_sale && product.sale_price && (
                        <div className="text-xs text-yellow-400">Sale: ${product.sale_price.toFixed(2)}</div>
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
                        <button className="p-1 rounded-md hover:bg-gray-700">
                          <Eye className="h-4 w-4 text-gray-400" />
                        </button>
                        <button 
                          onClick={() => setEditingProduct(product)}
                          className="p-1 rounded-md hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4 text-gray-400" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
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

        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-800">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700">
              {t('dashboard.previous') || 'Previous'}
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700">
              {t('dashboard.next') || 'Next'}
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-400">
                {t('dashboard.products.showing') || 'Showing'} <span className="font-medium">1</span> {t('dashboard.products.to') || 'to'} <span className="font-medium">10</span> {t('dashboard.products.of') || 'of'} <span className="font-medium">10</span> {t('dashboard.products.results') || 'results'}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700">
                  <span className="sr-only">{t('dashboard.previous') || 'Previous'}</span>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700">
                  1
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-700 bg-yellow-400 text-sm font-medium text-black">
                  2
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700">
                  3
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700">
                  <span className="sr-only">{t('dashboard.next') || 'Next'}</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDashboard;
