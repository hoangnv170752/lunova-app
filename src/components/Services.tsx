import React, { useEffect, useRef } from 'react';
import { Gem, Palette, Wrench, Heart, Crown, Gift } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Services: React.FC = () => {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  const services = [
    {
      icon: Gem,
      titleKey: 'services.custom.title',
      descriptionKey: 'services.custom.description',
      features: ['services.custom.feature1', 'services.custom.feature2', 'services.custom.feature3']
    },
    {
      icon: Palette,
      titleKey: 'services.restoration.title',
      descriptionKey: 'services.restoration.description',
      features: ['services.restoration.feature1', 'services.restoration.feature2', 'services.restoration.feature3']
    },
    {
      icon: Wrench,
      titleKey: 'services.repair.title',
      descriptionKey: 'services.repair.description',
      features: ['services.repair.feature1', 'services.repair.feature2', 'services.repair.feature3']
    },
    {
      icon: Heart,
      titleKey: 'services.wedding.title',
      descriptionKey: 'services.wedding.description',
      features: ['services.wedding.feature1', 'services.wedding.feature2', 'services.wedding.feature3']
    },
    {
      icon: Crown,
      titleKey: 'services.luxury.title',
      descriptionKey: 'services.luxury.description',
      features: ['services.luxury.feature1', 'services.luxury.feature2', 'services.luxury.feature3']
    },
    {
      icon: Gift,
      titleKey: 'services.souvenirs.title',
      descriptionKey: 'services.souvenirs.description',
      features: ['services.souvenirs.feature1', 'services.souvenirs.feature2', 'services.souvenirs.feature3']
    }
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial states
      gsap.set(titleRef.current, { opacity: 0, y: 50 });
      gsap.set(cardsRef.current, { opacity: 0, y: 80, scale: 0.8 });

      // Title animation
      gsap.to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      });

      // Cards animation with stagger
      gsap.to(cardsRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: cardsRef.current[0],
          start: "top 85%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      });

      // Hover animations for cards
      cardsRef.current.forEach((card) => {
        if (card) {
          const icon = card.querySelector('.service-icon');
          
          card.addEventListener('mouseenter', () => {
            gsap.to(card, {
              y: -10,
              scale: 1.02,
              duration: 0.3,
              ease: "power2.out"
            });
            
            gsap.to(icon, {
              scale: 1.2,
              rotation: 5,
              duration: 0.3,
              ease: "back.out(1.7)"
            });
          });

          card.addEventListener('mouseleave', () => {
            gsap.to(card, {
              y: 0,
              scale: 1,
              duration: 0.3,
              ease: "power2.out"
            });
            
            gsap.to(icon, {
              scale: 1,
              rotation: 0,
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
    <section ref={sectionRef} id="services" className="py-20 bg-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-yellow-400 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            {t('services.title').split(' ')[0]} <span className="text-yellow-400">{t('services.title').split(' ')[1]}</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t('services.description')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={index}
              ref={addToCardsRefs}
              className="bg-black/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-400/50 transition-all cursor-pointer backdrop-blur-sm relative overflow-hidden group"
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="text-yellow-400 mb-4 service-icon">
                  <service.icon className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors">
                  {t(service.titleKey)}
                </h3>
                <p className="text-gray-300 mb-4 group-hover:text-gray-200 transition-colors">
                  {t(service.descriptionKey)}
                </p>
                <ul className="space-y-2">
                  {service.features.map((featureKey, featureIndex) => (
                    <li key={featureIndex} className="text-sm text-gray-400 flex items-center group-hover:text-gray-300 transition-colors">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-2 group-hover:scale-125 transition-transform"></div>
                      {t(featureKey)}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Animated border effect */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 rounded-xl border border-yellow-400/30 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;