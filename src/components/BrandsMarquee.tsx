import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const BrandsMarquee: React.FC = () => {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const firstRowRef = useRef<HTMLDivElement>(null);
  const secondRowRef = useRef<HTMLDivElement>(null);

  const brands = [
    { name: 'Tiffany & Co.', type: 'luxury' },
    { name: 'Cartier', type: 'luxury' },
    { name: 'Bulgari', type: 'luxury' },
    { name: 'Van Cleef & Arpels', type: 'luxury' },
    { name: 'Harry Winston', type: 'luxury' },
    { name: 'Chopard', type: 'luxury' },
    { name: 'Graff', type: 'luxury' },
    { name: 'Boucheron', type: 'luxury' },
    { name: 'Piaget', type: 'luxury' },
    { name: 'Mikimoto', type: 'pearl' },
    { name: 'David Yurman', type: 'designer' },
    { name: 'John Hardy', type: 'artisan' }
  ];

  const souvenirs = [
    { name: 'Custom Engravings', type: 'service' },
    { name: 'Memory Lockets', type: 'keepsake' },
    { name: 'Wedding Favors', type: 'celebration' },
    { name: 'Anniversary Gifts', type: 'milestone' },
    { name: 'Birth Stones', type: 'personal' },
    { name: 'Charm Collections', type: 'collectible' },
    { name: 'Travel Souvenirs', type: 'memory' },
    { name: 'Corporate Gifts', type: 'business' },
    { name: 'Graduation Jewelry', type: 'achievement' },
    { name: 'Baby Keepsakes', type: 'milestone' },
    { name: 'Religious Symbols', type: 'spiritual' },
    { name: 'Cultural Artifacts', type: 'heritage' }
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // First row animation (brands) - left to right
      gsap.to(firstRowRef.current, {
        x: '-100%',
        duration: 60,
        ease: 'none',
        repeat: -1
      });

      // Second row animation (souvenirs) - right to left
      gsap.to(secondRowRef.current, {
        x: '100%',
        duration: 45,
        ease: 'none',
        repeat: -1
      });

      // Pause animations on hover
      const handleMouseEnter = () => {
        gsap.globalTimeline.pause();
      };

      const handleMouseLeave = () => {
        gsap.globalTimeline.resume();
      };

      if (marqueeRef.current) {
        marqueeRef.current.addEventListener('mouseenter', handleMouseEnter);
        marqueeRef.current.addEventListener('mouseleave', handleMouseLeave);
      }

      return () => {
        if (marqueeRef.current) {
          marqueeRef.current.removeEventListener('mouseenter', handleMouseEnter);
          marqueeRef.current.removeEventListener('mouseleave', handleMouseLeave);
        }
      };
    }, marqueeRef);

    return () => ctx.revert();
  }, []);

  const renderBrandItem = (item: { name: string; type: string }, index: number) => (
    <div
      key={`${item.name}-${index}`}
      className="flex-shrink-0 mx-8 group cursor-pointer"
    >
      <div className="text-white/40 hover:text-yellow-400/80 transition-all duration-300 text-lg font-light tracking-wider group-hover:scale-110 transform">
        {item.name}
      </div>
      <div className="text-xs text-gray-600 group-hover:text-yellow-400/60 transition-colors duration-300 text-center mt-1 capitalize">
        {item.type}
      </div>
    </div>
  );

  return (
    <section 
      ref={marqueeRef}
      className="py-16 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden border-y border-gray-800/50"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-yellow-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-yellow-400 rounded-full blur-2xl"></div>
      </div>

      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-900 to-transparent z-10"></div>
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10"></div>

      {/* First row - Jewelry Brands */}
      <div className="relative mb-8">
        <div className="flex items-center whitespace-nowrap">
          <div 
            ref={firstRowRef}
            className="flex items-center"
          >
            {/* Duplicate items for seamless loop */}
            {[...brands, ...brands, ...brands].map((brand, index) => 
              renderBrandItem(brand, index)
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent"></div>
        <div className="px-6">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent"></div>
      </div>

      {/* Second row - Souvenirs (opposite direction) */}
      <div className="relative">
        <div className="flex items-center whitespace-nowrap">
          <div 
            ref={secondRowRef}
            className="flex items-center"
            style={{ transform: 'translateX(-100%)' }}
          >
            {/* Duplicate items for seamless loop */}
            {[...souvenirs, ...souvenirs, ...souvenirs].map((souvenir, index) => 
              renderBrandItem(souvenir, index)
            )}
          </div>
        </div>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-1/4 left-1/3 w-1 h-1 bg-yellow-400/60 rounded-full animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-yellow-400/40 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-3/4 left-2/3 w-0.5 h-0.5 bg-yellow-400/50 rounded-full animate-pulse" style={{ animationDelay: '4s' }}></div>

      {/* Center logo/text overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center opacity-20">
          <div className="text-6xl font-bold text-yellow-400 mb-2 lunova-brand-alt">LUNOVA</div>
          <div className="text-sm text-white tracking-[0.5em] font-light">PREMIUM COLLECTION</div>
        </div>
      </div>
    </section>
  );
};

export default BrandsMarquee;