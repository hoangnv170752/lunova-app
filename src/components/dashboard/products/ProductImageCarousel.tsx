import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import gsap from 'gsap';

interface ProductImage {
  id: string;
  image_url: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
}

interface ProductImageCarouselProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onImagesUpdated?: () => void;
}

const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  onImagesUpdated
}) => {
  const { t } = useLanguage();
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  
  // Fetch product images using useCallback to memoize the function
  const fetchProductImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/product-images/?product_id=${productId}&skip=0&limit=100`,
        {
          headers: {
            'accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch product images');
      }
      
      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error('Error fetching product images:', error);
      setError(typeof error === 'string' ? error : (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [productId]);
  
  useEffect(() => {
    if (isOpen && productId) {
      fetchProductImages();
    }
  }, [isOpen, productId, fetchProductImages]);
  
  // GSAP animations
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Animate modal opening
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }
      );
    }
  }, [isOpen]);
  
  const animateCards = useCallback(() => {
    if (!cardsRef.current || cardsRef.current.length === 0) return;
    
    // Reset all cards
    gsap.set(cardsRef.current, {
      x: 0,
      opacity: 0.3,
      scale: 0.8,
      zIndex: 1,
      rotationY: 0
    });
    
    // Animate current card
    gsap.to(cardsRef.current[currentIndex], {
      opacity: 1,
      scale: 1,
      zIndex: 10,
      duration: 0.5,
      ease: "power3.out"
    });
    
    // Animate previous cards
    if (currentIndex > 0) {
      gsap.to(cardsRef.current[currentIndex - 1], {
        x: -100,
        opacity: 0.7,
        scale: 0.9,
        zIndex: 5,
        rotationY: 15,
        duration: 0.5
      });
    }
    
    // Animate next cards
    if (currentIndex < images.length - 1) {
      gsap.to(cardsRef.current[currentIndex + 1], {
        x: 100,
        opacity: 0.7,
        scale: 0.9,
        zIndex: 5,
        rotationY: -15,
        duration: 0.5
      });
    }
  }, [currentIndex, images.length]);
  
  useEffect(() => {
    if (images.length > 0 && cardsRef.current.length > 0) {
      animateCards();
    }
  }, [currentIndex, images, animateCards]);
  
  // fetchProductImages moved to useCallback above
  
  // animateCards moved to useCallback above
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDeleteImage = useCallback(async (imageId: string) => {
    setDeleteLoading(true);
    setDeleteError(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/product-images/${imageId}`,
        {
          method: 'DELETE',
          headers: {
            'accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to delete product image');
      }
      
      // Remove the deleted image from the local state
      setImages(prevImages => prevImages.filter(img => img.id !== imageId));
      
      // If we deleted the current image, adjust the current index
      if (currentIndex >= images.length - 1) {
        setCurrentIndex(Math.max(0, images.length - 2));
      }
      
      // Notify parent component if needed
      if (onImagesUpdated) {
        onImagesUpdated();
      }
      
      setShowDeleteConfirm(false);
      setImageToDelete(null);
    } catch (error) {
      console.error('Error deleting product image:', error);
      setDeleteError(typeof error === 'string' ? error : (error as Error).message);
    } finally {
      setDeleteLoading(false);
    }
  }, [currentIndex, images.length, onImagesUpdated]);
  
  const openDeleteConfirmation = (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    setImageToDelete(imageId);
    setShowDeleteConfirm(true);
  };
  
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setImageToDelete(null);
    setDeleteError(null);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="relative w-full max-w-4xl bg-gray-900 rounded-lg shadow-xl overflow-hidden"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-yellow-500 flex items-center justify-center">
              <span className="text-black font-bold">{productName.substring(0, 1)}</span>
            </div>
            <h3 className="text-lg font-medium text-white">{productName}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-800"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        
        {/* Carousel content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-400 p-4">
              {error}
            </div>
          ) : images.length === 0 ? (
            <div className="text-center text-gray-400 p-4">
              {t('dashboard.products.noImages') || 'No images available for this product'}
            </div>
          ) : (
            <div className="relative">
              {/* Carousel container */}
              <div 
                ref={carouselRef}
                className="relative h-[400px] overflow-hidden flex items-center justify-center perspective-1000"
              >
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    ref={el => cardsRef.current[index] = el}
                    className="absolute w-full max-w-md h-[350px] bg-gray-800 rounded-lg overflow-hidden shadow-xl transition-all"
                  >
                    <div className="relative h-full">
                      <img 
                        src={image.image_url} 
                        alt={image.alt_text || 'Product image'} 
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-2 right-2 flex space-x-2">
                        {image.is_primary && (
                          <div className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full">
                            {t('dashboard.products.primary') || 'Primary'}
                          </div>
                        )}
                        <button 
                          onClick={(e) => openDeleteConfirmation(e, image.id)}
                          className="bg-red-500/70 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Navigation controls */}
              <div className="absolute inset-y-0 left-0 flex items-center">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className={`p-2 rounded-full bg-black/50 hover:bg-black/70 ${
                    currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                  onClick={handleNext}
                  disabled={currentIndex === images.length - 1}
                  className={`p-2 rounded-full bg-black/50 hover:bg-black/70 ${
                    currentIndex === images.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>
              </div>
              
              {/* Pagination indicators */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-2 pb-4">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 w-2 rounded-full ${
                      index === currentIndex ? 'bg-yellow-500' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Modal footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400">
            {images.length > 0 && (
              <>
                {currentIndex + 1} / {images.length} {t('dashboard.products.images') || 'images'}
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded"
          >
            {t('common.close') || 'Close'}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl border border-gray-800">
            <div className="flex items-center mb-4 text-red-500">
              <AlertCircle className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-medium">{t('dashboard.products.confirmDelete') || 'Confirm Delete'}</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              {t('dashboard.products.deleteImageConfirmation') || 'Are you sure you want to delete this image? This action cannot be undone.'}
            </p>
            
            {deleteError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded text-red-300 text-sm">
                {deleteError}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded transition-colors"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={() => imageToDelete && handleDeleteImage(imageToDelete)}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors flex items-center"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    {t('common.deleting') || 'Deleting...'}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t('common.delete') || 'Delete'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageCarousel;
