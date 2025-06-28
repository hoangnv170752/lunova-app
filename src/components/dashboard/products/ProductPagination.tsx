import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ProductPagination: React.FC<ProductPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  const { t } = useLanguage();

  return (
    <div className="px-6 py-4 flex items-center justify-between border-t border-gray-800">
      <div className="flex-1 flex justify-between sm:hidden">
        <button 
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('dashboard.previous') || 'Previous'}
        </button>
        <button 
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('dashboard.next') || 'Next'}
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-400">
            {t('dashboard.products.showing') || 'Showing'} <span className="font-medium">1</span> {t('dashboard.products.to') || 'to'} <span className="font-medium">10</span> {t('dashboard.products.of') || 'of'} <span className="font-medium">{totalPages * 10}</span> {t('dashboard.products.results') || 'results'}
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button 
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">{t('dashboard.previous') || 'Previous'}</span>
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            {/* Generate page buttons */}
            {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
              const pageNumber = idx + 1;
              return (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange(pageNumber)}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-700 ${
                    currentPage === pageNumber ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  } text-sm font-medium`}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            <button 
              onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">{t('dashboard.next') || 'Next'}</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default ProductPagination;
