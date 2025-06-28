import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import UserSettingsModal from '../modals/UserSettingsModal';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import ProductHeader from './products/ProductHeader';
import ProductTable from './products/ProductTable';
import ProductPagination from './products/ProductPagination';
import ProductFormModal from './products/ProductFormModal';
import { Product, ProductFormData } from '../../types/Product';
import { Upload, X, Image as ImageIcon, Sparkles, Loader, CheckCircle, AlertCircle } from 'lucide-react';

const ProductDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Product state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shops, setShops] = useState<{id: string, name: string}[]>([]);
  
  // State for image upload modal
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiEnhancedImages, setAiEnhancedImages] = useState<{original: File, enhanced: string}[]>([]);
  const [verifyingImage, setVerifyingImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<{file: File, url: string}[]>([]);

  // State for product form data
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

  // Function to fetch products based on shop ID
  const fetchProducts = useCallback(async (shopId: string) => {
    try {
      setLoading(true);
      // Build URL with query parameters if shop_id is selected
      let url = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/products/`;
      if (shopId) {
        url = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/products/?shop_id=${shopId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data);
    } catch (err: unknown) {
      setError(t('dashboard.errorFetchingProducts') || 'Error fetching products. Please try again later.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [t, setLoading, setProducts, setError]);

  // Fetch shops when component mounts
  useEffect(() => {
    const fetchShops = async () => {
      try {
        if (user?.id) {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/shops/?owner_id=${user.id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch shops');
          }
          const data = await response.json();
          const shopsList = data.map((shop: {id: string, name: string}) => ({ id: shop.id, name: shop.name }));
          setShops(shopsList);
          
          // Automatically select the first shop and fetch its products
          if (shopsList.length > 0) {
            const firstShopId = shopsList[0].id;
            setSelectedShopId(firstShopId);
            fetchProducts(firstShopId);
          }
        }
      } catch (err) {
        console.error('Error fetching shops:', err);
      }
    };

    fetchShops();
  }, [user?.id, t, fetchProducts]);
  
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
  
  // Handle image upload modal
  const openImageUploadModal = () => { 
    if (!selectedProduct) {
      alert(t('dashboard.products.selectProductFirst') || 'Please select a product first');
      return;
    }
    setShowImageUploadModal(true);
    setImageUploadError(null);
  };

  const closeImageUploadModal = () => { 
    setShowImageUploadModal(false); 
    setUploadedImages([]); 
    setIsDragging(false);
    setImageUploadError(null);
    setVerifyingImage(null);
    setUploadedUrls([]);
    setAiEnhancedImages([]);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(
        file => file.type.startsWith('image/')
      );
      setUploadedImages(prevImages => [...prevImages, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(
        file => file.type.startsWith('image/')
      );
      setUploadedImages(prevImages => [...prevImages, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prevImages => {
      const newImages = [...prevImages];
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleUploadImages = async () => {
    // Clear any previous errors
    setImageUploadError(null);
    
    if (uploadedImages.length === 0 && uploadedUrls.length === 0) {
      setImageUploadError(t('dashboard.products.noImagesSelected') || 'Please select at least one image');
      return;
    }
    
    // If we have already uploaded images, save them to the product
    if (uploadedUrls.length > 0 && selectedProduct) {
      try {
        setIsUploading(true); // Show loading state
        
        // For each uploaded URL, create a product image record
        for (const item of uploadedUrls) {
          const productImageData = {
            product_id: selectedProduct.id,
            image_url: item.url,
            alt_text: item.file.name || 'Product image',
            is_primary: uploadedUrls.indexOf(item) === 0, // First image is primary
            display_order: uploadedUrls.indexOf(item)
          };
          
          console.log('Saving product image:', productImageData);
          
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/product-images/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productImageData),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to save product image';
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.detail || errorMessage;
            } catch {
              // If parsing fails, use the raw error text
              errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
          }
        }
        
        // Success - close modal and reset state
        closeImageUploadModal();
        // Refresh products to show new images
        fetchProducts(selectedShopId);
      } catch (error) {
        console.error('Error saving product images:', error);
        setImageUploadError(typeof error === 'string' ? error : (error as Error).message);
      } finally {
        setIsUploading(false);
      }
    } else if (uploadedImages.length > 0) {
      // Start verification process with the first image
      setVerifyingImage(uploadedImages[0]);
    } else {
      setImageUploadError(t('dashboard.products.noImagesSelected') || 'Please select at least one image');
    }
  };
  
  const handleVerifyUpload = async () => {
    if (!verifyingImage || !selectedProduct) return;
    
    setIsUploading(true);
    setImageUploadError(null);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', verifyingImage);
      formData.append('folder', 'products');
      
      console.log('Uploading file:', verifyingImage.name, 'size:', verifyingImage.size);
      
      // Upload the file to storage
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/storage/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to upload image';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If parsing fails, use the raw error text
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Upload successful:', data);
      
      // Add the uploaded URL to our list
      setUploadedUrls(prev => [...prev, { file: verifyingImage, url: data.url }]);
      
      // Remove the verified image from uploadedImages
      setUploadedImages(prev => prev.filter(img => img !== verifyingImage));
      
      // Move to next image or finish
      if (uploadedImages.length > 1) {
        // Get the next image (after removing the current one)
        const remainingImages = uploadedImages.filter(img => img !== verifyingImage);
        if (remainingImages.length > 0) {
          setVerifyingImage(remainingImages[0]);
        } else {
          setVerifyingImage(null);
        }
      } else {
        // All images verified
        setVerifyingImage(null);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setImageUploadError(typeof error === 'string' ? error : (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };
  
  const cancelVerification = () => {
    setVerifyingImage(null);
  };
  
  const handleAiEnhance = () => {
    if (uploadedImages.length < 2) {
      setImageUploadError(t('dashboard.products.aiEnhanceMinimum') || 'Select at least 2 images for AI enhancement');
      return;
    }
    
    setIsAiProcessing(true);
    setImageUploadError(null);
    
    // Simulate AI processing with a timeout
    setTimeout(() => {
      // Mock enhanced images - in a real app, you would call your AI service
      const enhanced = uploadedImages.map(file => ({
        original: file,
        enhanced: URL.createObjectURL(file) // In a real app, this would be the enhanced image URL
      }));
      
      setAiEnhancedImages(enhanced);
      setIsAiProcessing(false);
    }, 2000);
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

  // Handle shop selection change
  useEffect(() => {
    if (selectedShopId) {
      fetchProducts(selectedShopId);
    } else {
      fetchProducts('');
    }
  }, [selectedShopId, fetchProducts]);

  // Handlers for UI interactions
  const handleAddProduct = () => {
    setShowCreateModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleCloseModal = () => {
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
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Product Form Modal */}
      {(showCreateModal || editingProduct) && (
        <ProductFormModal
          isOpen={showCreateModal || !!editingProduct}
          onClose={handleCloseModal}
          formData={formData}
          setFormData={setFormData}
          error={error}
          isSubmitting={isSubmitting}
          editingProduct={editingProduct}
          shops={shops}
          onSubmit={handleSubmit}
        />
      )}
      
      {/* User Settings Modal */}
      {isSettingsModalOpen && (
        <UserSettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={() => setIsSettingsModalOpen(false)} 
        />
      )}
      
      {/* Image Upload Modal */}
      {showImageUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/90 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header - macOS style */}
            <div className="bg-gray-800/80 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-2">
                  <button 
                    onClick={closeImageUploadModal}
                    className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"
                  >
                    <span className="sr-only">Close</span>
                  </button>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              <h2 className="text-lg font-medium text-white">
                {selectedProduct 
                  ? `${t('dashboard.products.uploadImagesFor') || 'Upload Images for'} ${selectedProduct.name}` 
                  : t('dashboard.products.uploadImages') || 'Upload Images'}
              </h2>
              <div className="w-16"></div> {/* Spacer for centering title */}
            </div>
            
            {/* Modal Body */}
            <div className="p-4 overflow-y-auto custom-scrollbar">
              {/* Verification Dialog */}
              {verifyingImage && (
                <div className="mb-6 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-300 mb-3 flex items-center gap-2">
                    <CheckCircle size={16} />
                    {t('dashboard.products.verifyUpload') || 'Verify Upload'}
                  </h4>
                  <p className="text-xs text-blue-200/70 mb-4">
                    {t('dashboard.products.verifyDescription') || 'Confirm to upload this image to the system'}
                  </p>
                  
                  <div className="flex gap-4 items-center mb-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                      <img 
                        src={URL.createObjectURL(verifyingImage)} 
                        alt={verifyingImage.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-300 mb-1">{verifyingImage.name}</p>
                      <p className="text-xs text-gray-400">{(verifyingImage.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={cancelVerification}
                      disabled={isUploading}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                    >
                      {t('common.cancel') || 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyUpload}
                      disabled={isUploading}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center gap-1.5 transition-colors"
                    >
                      {isUploading ? (
                        <>
                          <Loader size={14} className="animate-spin" />
                          {t('dashboard.products.uploading') || 'Uploading...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle size={14} />
                          {t('dashboard.products.verify') || 'Verify'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Uploaded URLs */}
              {uploadedUrls.length > 0 && !verifyingImage && (
                <div className="mb-6 p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
                  <h4 className="text-sm font-medium text-green-300 mb-3 flex items-center gap-2">
                    <CheckCircle size={16} />
                    {t('dashboard.products.uploadSuccess') || 'Images uploaded successfully'} ({uploadedUrls.length})
                  </h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                    {uploadedUrls.map((item, index) => (
                      <div key={`uploaded-${index}`} className="relative">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-800 border border-green-700/30">
                          <img 
                            src={item.url} 
                            alt={item.file.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="absolute top-1 right-1 bg-green-500/80 rounded-full p-1">
                          <CheckCircle size={12} className="text-white" />
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-1">{item.file.name}</p>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-green-200/70">
                    {t('dashboard.products.uploadSuccess') || 'Click Upload to save these images to the product'}
                  </p>
                </div>
              )}
              {/* Drag and drop area */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 mb-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 hover:border-gray-500'}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <ImageIcon size={48} className="text-gray-400 mb-3" />
                <p className="text-center text-gray-300 mb-2">
                  {t('dashboard.products.dragDropImages') || 'Drag and drop images here'}
                </p>
                <p className="text-center text-gray-500 text-sm">
                  {t('dashboard.products.orClickToUpload') || 'or click to upload from your device'}
                </p>
                <input 
                  type="file" 
                  id="file-upload" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileSelect} 
                />
              </div>
              
              {/* Preview of uploaded images */}
              {uploadedImages.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-300">
                      {t('dashboard.products.uploadedImages') || 'Uploaded Images'} ({uploadedImages.length})
                    </h3>
                    
                    {/* AI Enhance Button - only show when 2+ images */}
                    {uploadedImages.length >= 2 && !isAiProcessing && aiEnhancedImages.length === 0 && (
                      <button
                        type="button"
                        onClick={handleAiEnhance}
                        className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Sparkles size={14} />
                        {t('dashboard.products.aiEnhance') || 'AI Enhance Images'}
                      </button>
                    )}
                    
                    {/* AI Processing Indicator */}
                    {isAiProcessing && (
                      <div className="flex items-center gap-2 text-purple-400 text-xs">
                        <Loader size={14} className="animate-spin" />
                        {t('dashboard.products.aiProcessing') || 'AI is processing your images...'}
                      </div>
                    )}
                  </div>
                  
                  {/* AI Enhanced Images */}
                  {aiEnhancedImages.length > 0 && (
                    <div className="mb-6 p-4 bg-purple-900/20 border border-purple-800/50 rounded-lg">
                      <h4 className="text-sm font-medium text-purple-300 mb-3 flex items-center gap-2">
                        <Sparkles size={16} />
                        {t('dashboard.products.aiEnhance') || 'AI Enhanced Images'}
                      </h4>
                      <p className="text-xs text-purple-200/70 mb-4">
                        {t('dashboard.products.aiEnhanceDescription') || 'Use AI to enhance your product images'}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                        {aiEnhancedImages.map((item, index) => (
                          <div key={`enhanced-${index}`} className="space-y-2">
                            <div className="flex gap-2 items-center">
                              <div className="flex-1 aspect-square rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                                <img 
                                  src={URL.createObjectURL(item.original)} 
                                  alt="Original" 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              <div className="flex-1 aspect-square rounded-lg overflow-hidden bg-gray-800 border border-purple-700/50">
                                <img 
                                  src={item.enhanced} 
                                  alt="Enhanced" 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Original</span>
                              <span className="text-purple-300">Enhanced</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Original Images Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={file.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="absolute top-1 right-1 bg-black/60 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} className="text-white" />
                        </button>
                        <p className="text-xs text-gray-400 truncate mt-1">{file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Error message */}
            {imageUploadError && (
              <div className="px-4 py-3 bg-red-900/30 border border-red-800 rounded-lg mb-4 flex items-start gap-2">
                <AlertCircle size={16} className="text-red-300 mt-0.5 flex-shrink-0" />
                <p className="text-red-200 text-sm">{imageUploadError}</p>
              </div>
            )}
            
            {/* Modal Footer */}
            <div className="border-t border-gray-700 p-4 bg-gray-800/50 flex justify-end space-x-3">

              <button 
                type="button"
                onClick={handleUploadImages}
                disabled={(uploadedImages.length === 0 && uploadedUrls.length === 0) || isUploading}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${(uploadedImages.length === 0 && uploadedUrls.length === 0) || isUploading ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600 text-black font-medium'}`}
              >
                {isUploading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    {t('dashboard.products.uploading') || 'Uploading...'}
                  </>
                ) : (
                  <>
                    {uploadedUrls.length > 0 ? <CheckCircle size={16} /> : <Upload size={16} />}
                    {uploadedUrls.length > 0 
                      ? `${t('dashboard.products.upload') || 'Upload'} (${uploadedUrls.length})`
                      : t('dashboard.products.upload') || 'Upload'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <DashboardSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <DashboardHeader
          title={t('dashboard.products.title') || 'Products'}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* Product Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            {/* Product Header with Search and Filters */}
            <ProductHeader
              productCount={products.length}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedShopId={selectedShopId}
              setSelectedShopId={setSelectedShopId}
              shops={shops}
              onAddProduct={handleAddProduct}
            />
            
            {/* Upload Images Button */}
            <div className="mb-4 flex justify-end px-5">
              <button
                onClick={openImageUploadModal}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                disabled={!selectedProduct}
              >
                <Upload size={16} />
                {selectedProduct 
                  ? `${t('dashboard.products.manageImages') || 'Manage Images'}: ${selectedProduct.name}` 
                  : t('dashboard.products.uploadImages') || 'Upload Images'}
              </button>
            </div>

            {/* Product Table */}
            <ProductTable
              loading={loading}
              searchQuery={searchQuery}
              filteredProducts={filteredProducts}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              selectedProduct={selectedProduct}
              onSelectProduct={handleSelectProduct}
              onRefresh={() => fetchProducts(selectedShopId)}
            />

            {/* Pagination */}
            <ProductPagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredProducts.length / 10) || 1}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDashboard;
