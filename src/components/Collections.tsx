import React, { useEffect, useRef } from 'react';
import { ArrowRight, Eye, Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Collections: React.FC = () => {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const collections = [
    {
      titleKey: "collections.diamond.title",
      descriptionKey: "collections.diamond.description",
      image: "https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "$1,299",
      category: "Luxury"
    },
    {
      titleKey: "collections.pearl.title",
      descriptionKey: "collections.pearl.description",
      image: "https://images.pexels.com/photos/691046/pexels-photo-691046.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "$299",
      category: "Classic"
    },
    {
      titleKey: "collections.gold.title",
      descriptionKey: "collections.gold.description",
      image: "https://images.pexels.com/photos/1927258/pexels-photo-1927258.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "$599",
      category: "Traditional"
    },
    {
      titleKey: "collections.modern.title",
      descriptionKey: "collections.modern.description",
      image: "https://images.pexels.com/photos/1927248/pexels-photo-1927248.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "$199",
      category: "Contemporary"
    },
    {
      titleKey: "collections.vintage.title",
      descriptionKey: "collections.vintage.description",
      image: "https://images.pexels.com/photos/1927255/pexels-photo-1927255.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "$899",
      category: "Vintage"
    },
    {
      titleKey: "collections.custom.title",
      descriptionKey: "collections.custom.description",
      image: "https://images.pexels.com/photos/1927260/pexels-photo-1927260.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "$799",
      category: "Custom"
    }
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial states
      gsap.set(titleRef.current, { opacity: 0, y: 50 });
      gsap.set(cardsRef.current, { opacity: 0, y: 100, rotationY: 15 });
      gsap.set(buttonRef.current, { opacity: 0, scale: 0.8 });

      // Title animation
      gsap.to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      });

      // Cards animation with 3D effect
      gsap.to(cardsRef.current, {
        opacity: 1,
        y: 0,
        rotationY: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: cardsRef.current[0],
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      });

      // Button animation
      gsap.to(buttonRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: buttonRef.current,
          start: "top 90%",
          toggleActions: "play none none reverse"
        }
      });

      // Enhanced hover animations for cards
      cardsRef.current.forEach((card) => {
        if (card) {
          const image = card.querySelector('img');
          const overlay = card.querySelector('.card-overlay');
          const actionButtons = card.querySelectorAll('.action-btn');
          const category = card.querySelector('.category-badge');
          const content = card.querySelector('.card-content');

          card.addEventListener('mouseenter', () => {
            gsap.to(card, {
              y: -15,
              scale: 1.03,
              duration: 0.4,
              ease: "power2.out"
            });

            gsap.to(image, {
              scale: 1.1,
              duration: 0.6,
              ease: "power2.out"
            });

            gsap.to(actionButtons, {
              opacity: 1,
              scale: 1,
              stagger: 0.1,
              duration: 0.3,
              ease: "back.out(1.7)"
            });

            gsap.to(category, {
              scale: 1.1,
              duration: 0.3,
              ease: "power2.out"
            });

            gsap.to(content, {
              y: -5,
              duration: 0.3,
              ease: "power2.out"
            });
          });

          card.addEventListener('mouseleave', () => {
            gsap.to(card, {
              y: 0,
              scale: 1,
              duration: 0.4,
              ease: "power2.out"
            });

            gsap.to(image, {
              scale: 1,
              duration: 0.6,
              ease: "power2.out"
            });

            gsap.to(actionButtons, {
              opacity: 0,
              scale: 0.8,
              duration: 0.2,
              ease: "power2.out"
            });

            gsap.to(category, {
              scale: 1,
              duration: 0.3,
              ease: "power2.out"
            });

            gsap.to(content, {
              y: 0,
              duration: 0.3,
              ease: "power2.out"
            });
          });
        }
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const addToCardsRefs = (el: HTMLDivElement | null) => {
    if (el && !cardsRef.current.includes(el)) {
      cardsRef.current.push(el);
    }
  };

  return (
    <section ref={sectionRef} id="collections" className="py-20 bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-yellow-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-yellow-400 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            {t('collections.title').split(' ')[0]} <span className="text-yellow-400">{t('collections.title').split(' ')[1]}</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t('collections.description')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((collection, index) => (
            <div 
              key={index}
              ref={addToCardsRefs}
              className="group relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 hover:border-yellow-400/50 transition-all cursor-pointer"
            >
              <div className="relative overflow-hidden">
                <img 
                  src={collection.image} 
                  alt={t(collection.titleKey)}
                  className="w-full h-64 object-cover transition-transform duration-700"
                />
                <div className="card-overlay absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300"></div>
                <div className="category-badge absolute top-4 right-4 bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-medium">
                  {collection.category}
                </div>
                <div className="absolute top-4 left-4 flex space-x-2">
                  <button className="action-btn bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-yellow-400 hover:text-black transition-all opacity-0 scale-75">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="action-btn bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-yellow-400 hover:text-black transition-all opacity-0 scale-75">
                    <Heart className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="card-content p-6">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                  {t(collection.titleKey)}
                </h3>
                <p className="text-gray-300 mb-4 group-hover:text-gray-200 transition-colors">
                  {t(collection.descriptionKey)}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 font-semibold text-lg">
                    {t('collections.from')} {collection.price}
                  </span>
                  <button className="flex items-center space-x-2 text-yellow-400 hover:text-white transition-colors group/btn">
                    <span>{t('collections.view')}</span>
                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <button 
            ref={buttonRef}
            className="bg-yellow-400 text-black px-8 py-4 rounded-lg font-semibold hover:bg-yellow-300 transition-all transform hover:scale-105 relative overflow-hidden group"
          >
            <span className="relative z-10">{t('collections.viewAll')}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Collections;