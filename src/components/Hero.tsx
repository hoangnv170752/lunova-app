import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Star, Award } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AuthModal from './auth/AuthModal';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Hero: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Refs for GSAP animations
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const backgroundImageRef = useRef<HTMLDivElement>(null);
  const floatingElementsRef = useRef<HTMLDivElement[]>([]);
  const badgeRef = useRef<HTMLDivElement>(null);
  const priceTagRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial setup - hide elements
      gsap.set([titleRef.current, descriptionRef.current, buttonsRef.current, statsRef.current], {
        opacity: 0,
        y: 50
      });
      
      gsap.set(backgroundImageRef.current, {
        opacity: 0,
        scale: 1.1,
        x: 100
      });

      gsap.set(badgeRef.current, {
        opacity: 0,
        y: -20
      });

      gsap.set(floatingElementsRef.current, {
        opacity: 0,
        scale: 0.5,
        rotation: 180
      });

      gsap.set(priceTagRef.current, {
        opacity: 0,
        scale: 0.5,
        rotation: 10
      });

      // Main timeline
      const tl = gsap.timeline({ delay: 0.5 });

      // Background image animation
      tl.to(backgroundImageRef.current, {
        opacity: 0.8,
        scale: 1,
        x: 0,
        duration: 1.5,
        ease: "power3.out"
      });

      // Badge animation
      tl.to(badgeRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "back.out(1.7)"
      }, "-=1.2");

      // Title animation with stagger
      tl.to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power3.out"
      }, "-=1");

      // Description
      tl.to(descriptionRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out"
      }, "-=0.8");

      // Buttons with bounce effect
      tl.to(buttonsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "back.out(1.7)"
      }, "-=0.5");

      // Stats with stagger
      tl.to(statsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.3");

      // Price tag animation
      tl.to(priceTagRef.current, {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.8,
        ease: "back.out(1.7)"
      }, "-=0.5");

      // Floating elements with stagger
      tl.to(floatingElementsRef.current, {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 1,
        stagger: 0.2,
        ease: "back.out(1.7)"
      }, "-=0.8");

      // Continuous floating animation for elements
      gsap.to(floatingElementsRef.current[0], {
        y: -10,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: 2
      });

      gsap.to(floatingElementsRef.current[1], {
        y: 8,
        rotation: 5,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: 2.5
      });

      // Price tag floating animation
      gsap.to(priceTagRef.current, {
        y: -5,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: 3
      });

      // Hover animations for buttons
      const buttons = buttonsRef.current?.querySelectorAll('button');
      buttons?.forEach(button => {
        button.addEventListener('mouseenter', () => {
          gsap.to(button, {
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out"
          });
        });

        button.addEventListener('mouseleave', () => {
          gsap.to(button, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          });
        });
      });

      // Parallax effect for background image
      gsap.to(backgroundImageRef.current, {
        y: -50,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });

    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Check if user is already logged in and redirect
  useEffect(() => {
    if (user) {
      // User is logged in, they should be redirected by the App component
      // This effect ensures the modal closes if somehow still open
      setIsAuthModalOpen(false);
    }
  }, [user]);

  const handleGetStarted = () => {
    // Add click animation
    const button = buttonsRef.current?.querySelector('button');
    if (button) {
      gsap.to(button, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
        onComplete: () => setIsAuthModalOpen(true)
      });
    } else {
      // If button doesn't exist, just open the modal
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    // Close the modal
    setIsAuthModalOpen(false);
    
    // Add a success animation
    gsap.to(buttonsRef.current, {
      scale: 1.1,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
      onComplete: () => {
        navigate('/dashboard');
      }
    });
  };

  const addToFloatingRefs = (el: HTMLDivElement | null) => {
    if (el && !floatingElementsRef.current.includes(el)) {
      floatingElementsRef.current.push(el);
    }
  };

  return (
    <>
      <section 
        ref={heroRef}
        id="home" 
        className="relative min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden"
      >
        {/* Background Image */}
        <div 
          ref={backgroundImageRef}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10"></div>
          <img 
            src="https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg?auto=compress&cs=tinysrgb&w=1200" 
            alt="Luxury jewelry collection" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/40 z-10"></div>
        </div>

        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 opacity-10 z-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 30% 50%, rgba(212, 175, 55, 0.3) 0%, transparent 50%),
                             radial-gradient(circle at 20% 80%, rgba(212, 175, 55, 0.2) 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.2) 0%, transparent 50%)`
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 pt-24 pb-12 relative z-30">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            <div className="space-y-8 relative z-40">
              <div 
                ref={badgeRef}
                className="flex items-center space-x-2 text-yellow-400"
              >
                <Star className="h-5 w-5 fill-current" />
                <span className="text-sm font-medium">{t('hero.badge')}</span>
              </div>
              
              <h1 
                ref={titleRef}
                className="text-5xl lg:text-7xl font-bold text-white leading-tight"
              >
                {t('hero.title.line1')}
                <span className="block text-yellow-400">{t('hero.title.line2')}</span>
                <span className="block text-gray-300">{t('hero.title.line3')}</span>
              </h1>
              
              <p 
                ref={descriptionRef}
                className="text-xl text-gray-300 leading-relaxed max-w-lg"
              >
                {t('hero.description')}
              </p>
              
              <div 
                ref={buttonsRef}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button 
                  onClick={handleGetStarted}
                  className="bg-yellow-400 text-black px-8 py-4 rounded-lg font-semibold hover:bg-yellow-300 transition-all flex items-center justify-center space-x-2 relative overflow-hidden group"
                >
                  <span className="relative z-10">{t('hero.cta.getStarted')}</span>
                  <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                <button className="border border-yellow-400 text-yellow-400 px-8 py-4 rounded-lg font-semibold hover:bg-yellow-400 hover:text-black transition-all relative overflow-hidden group">
                  <span className="relative z-10">{t('hero.cta.consultation')}</span>
                  <div className="absolute inset-0 bg-yellow-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </button>
              </div>
              
              <div 
                ref={statsRef}
                className="flex items-center space-x-8 pt-8"
              >
                <div className="text-center transform hover:scale-110 transition-transform cursor-pointer">
                  <div className="text-3xl font-bold text-yellow-400">10k+</div>
                  <div className="text-gray-400 text-sm">{t('hero.stats.customers')}</div>
                </div>
                <div className="text-center transform hover:scale-110 transition-transform cursor-pointer">
                  <div className="text-3xl font-bold text-yellow-400">25+</div>
                  <div className="text-gray-400 text-sm">{t('hero.stats.experience')}</div>
                </div>
                <div className="text-center transform hover:scale-110 transition-transform cursor-pointer">
                  <div className="flex items-center justify-center space-x-1 text-yellow-400">
                    <Award className="h-6 w-6" />
                    <span className="text-2xl font-bold">{t('hero.stats.award')}</span>
                  </div>
                  <div className="text-gray-400 text-sm">{t('hero.stats.design')}</div>
                </div>
              </div>
            </div>
            
            {/* Right side with floating elements and price tag */}
            <div className="relative lg:block hidden">
              {/* Price tag positioned on the right */}
              <div 
                ref={priceTagRef}
                className="absolute top-1/2 right-8 transform -translate-y-1/2 bg-yellow-400 text-black p-6 rounded-xl hover:scale-110 transition-transform cursor-pointer shadow-2xl z-50"
              >
                <div className="text-sm font-medium">{t('hero.price.from')}</div>
                <div className="text-3xl font-bold">$299</div>
              </div>
              
              {/* Enhanced Floating elements */}
              <div 
                ref={addToFloatingRefs}
                className="absolute top-20 right-20 bg-gray-800/90 backdrop-blur-sm p-4 rounded-xl border border-yellow-400/20 hover:border-yellow-400/50 transition-all cursor-pointer z-40"
              >
                <div className="text-yellow-400 text-sm font-medium">{t('services.custom.title')}</div>
                <div className="text-white text-xs">Available</div>
              </div>
              
              <div 
                ref={addToFloatingRefs}
                className="absolute top-32 right-4 bg-gray-800/90 backdrop-blur-sm p-3 rounded-full border border-yellow-400/20 hover:border-yellow-400/50 transition-all cursor-pointer z-40"
              >
                <Star className="h-6 w-6 text-yellow-400 fill-current" />
              </div>

              {/* Additional floating elements for more dynamic feel */}
              <div className="absolute top-1/3 right-12 w-2 h-2 bg-yellow-400 rounded-full opacity-60 animate-pulse z-30"></div>
              <div className="absolute bottom-1/3 right-24 w-1 h-1 bg-yellow-400 rounded-full opacity-40 animate-pulse z-30" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>

        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-yellow-400/30 rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/3 w-0.5 h-0.5 bg-yellow-400/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-yellow-400/25 rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
        </div>
      </section>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default Hero;