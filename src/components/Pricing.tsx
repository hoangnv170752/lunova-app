import React, { useEffect, useRef, useState } from 'react';
import { Check, Star, Crown, Store, Eye, Users, Phone, Sparkles, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Pricing: React.FC = () => {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const contactSalesRef = useRef<HTMLButtonElement>(null);
  const tryOnExplanationRef = useRef<HTMLDivElement>(null);
  const businessHighlightsRef = useRef<HTMLDivElement>(null);
  const switchRef = useRef<HTMLDivElement>(null);
  const planContainerRef = useRef<HTMLDivElement>(null);

  const [planType, setPlanType] = useState<'buyer' | 'business'>('buyer');

  const buyerPlans = [
    {
      nameKey: "pricing.basic.name",
      price: "Free",
      descriptionKey: "pricing.basic.description",
      icon: Eye,
      features: [
        "Browse all collections",
        "30 try-on mode credits/month",
        "Basic product information",
        "Email support",
        "Wishlist functionality",
        "Basic search & filters"
      ],
      popular: false,
      category: "Buyer",
      buttonText: "Get Started Free",
      highlight: "Perfect for casual browsers"
    },
    {
      nameKey: "pricing.premium.name",
      price: "29",
      descriptionKey: "pricing.premium.description",
      icon: Crown,
      features: [
        "Everything in Basic",
        "100 try-on mode credits/month",
        "Advanced AR try-on features",
        "Priority customer support",
        "Exclusive early access",
        "Detailed product specifications",
        "Personal style recommendations",
        "Save unlimited favorites"
      ],
      popular: true,
      category: "Buyer",
      buttonText: "Start Premium Trial",
      highlight: "Most popular for jewelry lovers"
    }
  ];

  const businessPlans = [
    {
      nameKey: "pricing.business.name",
      price: "199",
      descriptionKey: "pricing.business.description",
      icon: Store,
      features: [
        "Complete shop management",
        "Unlimited product listings",
        "Advanced analytics dashboard",
        "Customer management tools",
        "Inventory tracking",
        "Multi-channel selling",
        "Custom branding options",
        "24/7 priority support",
        "API access",
        "White-label solutions"
      ],
      popular: false,
      category: "Shop Owner",
      buttonText: "Start Business Trial",
      highlight: "Complete solution for jewelry businesses"
    },
    {
      nameKey: "pricing.enterprise.name",
      price: "Custom",
      descriptionKey: "pricing.enterprise.description",
      icon: Crown,
      features: [
        "Everything in Business",
        "Unlimited stores & locations",
        "Advanced AI recommendations",
        "Custom integrations",
        "Dedicated account manager",
        "Custom training & onboarding",
        "SLA guarantees",
        "Advanced security features",
        "Custom reporting",
        "Priority feature requests"
      ],
      popular: true,
      category: "Enterprise",
      buttonText: "Contact Sales",
      highlight: "For large jewelry chains"
    }
  ];

  const currentPlans = planType === 'buyer' ? buyerPlans : businessPlans;

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial states
      gsap.set(titleRef.current, { opacity: 0, y: 50 });
      gsap.set(switchRef.current, { opacity: 0, scale: 0.8 });
      gsap.set(cardsRef.current, { opacity: 0, y: 100, rotationY: 15 });
      gsap.set(tryOnExplanationRef.current, { opacity: 0, scale: 0.9, y: 50 });
      gsap.set(businessHighlightsRef.current, { opacity: 0, scale: 0.9, y: 50 });
      gsap.set(contactSalesRef.current, { opacity: 0, scale: 0.8 });

      // Title animation with enhanced effects
      gsap.to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      });

      // Switch animation
      gsap.to(switchRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: switchRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      });

      // Cards animation with enhanced 3D effect
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

      // Try-on explanation animation
      gsap.to(tryOnExplanationRef.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: tryOnExplanationRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      });

      // Business highlights animation
      gsap.to(businessHighlightsRef.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: businessHighlightsRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      });

      // Define the ringing animation function
      const performRingingBurst = () => {
        if (contactSalesRef.current) {
          gsap.to(contactSalesRef.current, {
            rotation: 5,
            duration: 0.1,
            yoyo: true,
            repeat: 5,
            ease: "power2.inOut",
            onComplete: () => {
              // Schedule the next ringing animation
              gsap.delayedCall(4, performRingingBurst);
            }
          });
        }
      };

      // Contact Sales button with ringing animation
      gsap.to(contactSalesRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: contactSalesRef.current,
          start: "top 90%",
          toggleActions: "play none none reverse"
        },
        onComplete: () => {
          // Start continuous ringing animation
          gsap.to(contactSalesRef.current, {
            rotation: 5,
            duration: 0.1,
            yoyo: true,
            repeat: 5,
            ease: "power2.inOut",
            repeatDelay: 3,
            onComplete: () => {
              // Start the continuous ringing loop
              gsap.delayedCall(4, performRingingBurst);
            }
          });

          // Add pulsing glow effect
          gsap.to(contactSalesRef.current, {
            boxShadow: "0 0 20px rgba(212, 175, 55, 0.5)",
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: "power2.inOut"
          });
        }
      });

      // Enhanced hover animations for cards
      cardsRef.current.forEach((card) => {
        if (card) {
          const icon = card.querySelector('.plan-icon');
          const badge = card.querySelector('.popular-badge');
          const button = card.querySelector('.plan-button');
          const features = card.querySelectorAll('.feature-item');
          const price = card.querySelector('.price-display');
          const categoryBadge = card.querySelector('.category-badge');

          card.addEventListener('mouseenter', () => {
            gsap.to(card, {
              y: -20,
              scale: 1.03,
              rotationY: 2,
              duration: 0.4,
              ease: "power2.out"
            });

            gsap.to(icon, {
              scale: 1.3,
              rotation: 10,
              duration: 0.3,
              ease: "back.out(1.7)"
            });

            if (badge) {
              gsap.to(badge, {
                scale: 1.1,
                y: -5,
                duration: 0.3,
                ease: "back.out(1.7)"
              });
            }

            gsap.to(button, {
              scale: 1.05,
              y: -3,
              duration: 0.3,
              ease: "power2.out"
            });

            gsap.to(features, {
              x: 8,
              stagger: 0.02,
              duration: 0.3,
              ease: "power2.out"
            });

            gsap.to(price, {
              scale: 1.1,
              duration: 0.3,
              ease: "back.out(1.7)"
            });

            gsap.to(categoryBadge, {
              scale: 1.1,
              duration: 0.3,
              ease: "power2.out"
            });

            // Add floating sparkles effect
            const sparkles = card.querySelectorAll('.sparkle');
            gsap.to(sparkles, {
              opacity: 1,
              scale: 1,
              stagger: 0.1,
              duration: 0.5,
              ease: "back.out(1.7)"
            });
          });

          card.addEventListener('mouseleave', () => {
            gsap.to(card, {
              y: 0,
              scale: 1,
              rotationY: 0,
              duration: 0.4,
              ease: "power2.out"
            });

            gsap.to(icon, {
              scale: 1,
              rotation: 0,
              duration: 0.3,
              ease: "power2.out"
            });

            if (badge) {
              gsap.to(badge, {
                scale: 1,
                y: 0,
                duration: 0.3,
                ease: "power2.out"
              });
            }

            gsap.to(button, {
              scale: 1,
              y: 0,
              duration: 0.3,
              ease: "power2.out"
            });

            gsap.to(features, {
              x: 0,
              duration: 0.3,
              ease: "power2.out"
            });

            gsap.to(price, {
              scale: 1,
              duration: 0.3,
              ease: "power2.out"
            });

            gsap.to(categoryBadge, {
              scale: 1,
              duration: 0.3,
              ease: "power2.out"
            });

            // Hide sparkles
            const sparkles = card.querySelectorAll('.sparkle');
            gsap.to(sparkles, {
              opacity: 0,
              scale: 0.5,
              duration: 0.3,
              ease: "power2.out"
            });
          });
        }
      });

      // Contact Sales button enhanced hover
      if (contactSalesRef.current) {
        contactSalesRef.current.addEventListener('mouseenter', () => {
          gsap.to(contactSalesRef.current, {
            scale: 1.1,
            duration: 0.3,
            ease: "back.out(1.7)"
          });

          // Intensify the ringing on hover
          gsap.to(contactSalesRef.current, {
            rotation: 8,
            duration: 0.08,
            yoyo: true,
            repeat: 7,
            ease: "power2.inOut"
          });
        });

        contactSalesRef.current.addEventListener('mouseleave', () => {
          gsap.to(contactSalesRef.current, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          });
        });
      }

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Plan type switch animation
  const handlePlanTypeChange = (newType: 'buyer' | 'business') => {
    if (newType === planType) return;

    // Animate cards out
    gsap.to(cardsRef.current, {
      opacity: 0,
      y: 50,
      scale: 0.9,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        setPlanType(newType);
        // Clear the refs array for new cards
        cardsRef.current = [];
        
        // Animate new cards in after a brief delay
        gsap.delayedCall(0.1, () => {
          gsap.fromTo(cardsRef.current, 
            { opacity: 0, y: 50, scale: 0.9 },
            { 
              opacity: 1, 
              y: 0, 
              scale: 1,
              duration: 0.5,
              stagger: 0.1,
              ease: "back.out(1.7)"
            }
          );
        });
      }
    });
  };

  const addToCardsRefs = (el: HTMLDivElement | null) => {
    if (el && !cardsRef.current.includes(el)) {
      cardsRef.current.push(el);
    }
  };

  return (
    <section ref={sectionRef} id="pricing" className="py-20 bg-gray-900 relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-yellow-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-yellow-400 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-3/4 left-3/4 w-24 h-24 bg-yellow-400 rounded-full blur-xl animate-pulse" style={{ animationDelay: '6s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Choose Your <span className="text-yellow-400">Plan</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Whether you're a jewelry enthusiast or a business owner, we have the perfect plan to meet your needs.
          </p>
          
          {/* Animated Plan Type Switch */}
          <div ref={switchRef} className="flex justify-center mb-12">
            <div className="relative bg-black/50 border border-gray-700 rounded-xl p-2 backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePlanTypeChange('buyer')}
                  className={`relative flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 z-10 ${
                    planType === 'buyer'
                      ? 'text-black font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Eye className="h-5 w-5" />
                  <span>For Buyers</span>
                </button>
                <button
                  onClick={() => handlePlanTypeChange('business')}
                  className={`relative flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 z-10 ${
                    planType === 'business'
                      ? 'text-black font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Store className="h-5 w-5" />
                  <span>For Shop Owners</span>
                </button>
              </div>
              
              {/* Animated Background Slider */}
              <div 
                className={`absolute top-2 bottom-2 bg-yellow-400 rounded-lg transition-all duration-500 ease-out ${
                  planType === 'buyer' 
                    ? 'left-2 right-1/2 mr-1' 
                    : 'right-2 left-1/2 ml-1'
                }`}
              ></div>
              
              {/* Glow Effect */}
              <div 
                className={`absolute top-0 bottom-0 bg-yellow-400/20 rounded-lg blur-lg transition-all duration-500 ${
                  planType === 'buyer' 
                    ? 'left-0 right-1/2 mr-2' 
                    : 'right-0 left-1/2 ml-2'
                }`}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Plans Container with extra top padding for badges */}
        <div ref={planContainerRef} className={`grid gap-8 max-w-7xl mx-auto pt-8 ${currentPlans.length === 2 ? 'md:grid-cols-2 lg:grid-cols-2' : 'md:grid-cols-3'}`}>
          {currentPlans.map((plan, index) => (
            <div 
              key={`${planType}-${index}`}
              ref={addToCardsRefs}
              className={`relative rounded-xl p-8 border transition-all cursor-pointer group ${
                plan.popular 
                  ? 'bg-gradient-to-b from-yellow-400/10 to-transparent border-yellow-400 shadow-xl shadow-yellow-400/20' 
                  : 'bg-black/50 border-gray-800 hover:border-yellow-400/50'
              }`}
              style={{ overflow: 'visible' }}
            >
              {/* Floating sparkles */}
              <div className="sparkle absolute top-4 left-4 w-1 h-1 bg-yellow-400 rounded-full opacity-0"></div>
              <div className="sparkle absolute top-8 right-8 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-0"></div>
              <div className="sparkle absolute bottom-12 left-6 w-1 h-1 bg-yellow-400 rounded-full opacity-0"></div>
              <div className="sparkle absolute bottom-6 right-4 w-0.5 h-0.5 bg-yellow-400 rounded-full opacity-0"></div>

              {plan.popular && (
                <div className="popular-badge absolute left-1/2 transform -translate-x-1/2 z-30" style={{ top: '-20px' }}>
                  <div className="bg-yellow-400 text-black px-6 py-3 rounded-full text-sm font-bold flex items-center space-x-2 shadow-xl border-2 border-yellow-300">
                    <Star className="h-4 w-4 fill-current" />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}

              {/* Category Badge */}
              <div className="absolute top-4 right-4">
                <div className={`category-badge px-3 py-1 rounded-full text-xs font-medium ${
                  plan.category === 'Buyer' 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : plan.category === 'Shop Owner'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}>
                  {plan.category}
                </div>
              </div>
              
              <div className={`text-center mb-8 ${plan.popular ? 'mt-4' : ''}`}>
                <div className="plan-icon text-yellow-400 mb-4 flex justify-center">
                  <plan.icon className="h-12 w-12" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{t(plan.nameKey)}</h3>
                <p className="text-gray-300 mb-4 text-sm">{plan.highlight}</p>
                <div className="price-display flex items-baseline justify-center mb-2">
                  {plan.price === "Free" ? (
                    <span className="text-4xl font-bold text-yellow-400">Free</span>
                  ) : plan.price === "Custom" ? (
                    <span className="text-4xl font-bold text-yellow-400">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-yellow-400">${plan.price}</span>
                      <span className="text-gray-400 ml-2">/month</span>
                    </>
                  )}
                </div>
                <p className="text-gray-400 text-sm">{t(plan.descriptionKey)}</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="feature-item flex items-start text-gray-300 group-hover:text-gray-200 transition-colors">
                    <Check className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                className={`plan-button w-full py-4 rounded-lg font-semibold transition-all relative overflow-hidden group/btn ${
                  plan.popular
                    ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                    : 'bg-gray-800 text-white hover:bg-yellow-400 hover:text-black border border-gray-700 hover:border-yellow-400'
                }`}
              >
                <span className="relative z-10">{plan.buttonText}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-500 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
              </button>

              {/* Special features callout for premium plans */}
              {plan.price !== "Free" && (
                <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-2 text-yellow-400 mb-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium">Special Features</span>
                  </div>
                  {planType === 'buyer' ? (
                    <p className="text-xs text-gray-400">
                      Advanced AR try-on technology with realistic lighting and shadow effects
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      Complete business suite with advanced analytics and customer insights
                    </p>
                  )}
                </div>
              )}

              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Additional Information */}
        <div className="text-center mt-16 space-y-8">
          {/* Try-on Credits Explanation - Only show for buyer plans */}
          {planType === 'buyer' && (
            <div 
              ref={tryOnExplanationRef}
              className="bg-black/50 border border-gray-800 rounded-xl p-8 max-w-6xl mx-auto relative overflow-hidden group"
            >
              {/* Animated background elements */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-yellow-400/30 rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 left-4 w-1 h-1 bg-yellow-400/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center justify-center space-x-2">
                <Eye className="h-6 w-6 text-yellow-400" />
                <span>What are Try-On Mode Credits?</span>
                <Zap className="h-5 w-5 text-yellow-400 animate-pulse" />
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8 text-left">
                <div className="space-y-4">
                  <h4 className="text-yellow-400 font-semibold mb-3 flex items-center space-x-2">
                    <Sparkles className="h-4 w-4" />
                    <span>How it Works</span>
                  </h4>
                  <ul className="text-gray-300 space-y-3 text-sm">
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Each credit allows one virtual try-on session with our advanced AR technology</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Use your phone camera to see how jewelry looks on you in real-time</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Credits reset monthly on your billing date</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Unused credits don't roll over to the next month</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="text-yellow-400 font-semibold mb-3 flex items-center space-x-2">
                    <Crown className="h-4 w-4" />
                    <span>Premium AR Features</span>
                  </h4>
                  <ul className="text-gray-300 space-y-3 text-sm">
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Realistic lighting and shadow effects that match your environment</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>360° view with multiple angle perspectives</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Save and share try-on photos with friends and family</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Compare multiple pieces side-by-side in split-screen mode</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Usage Examples */}
              <div className="mt-8 p-6 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <h5 className="text-white font-semibold mb-4 text-center">Credit Usage Examples</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-gray-700/30 rounded-lg">
                    <div className="text-yellow-400 font-bold text-lg">1 Credit</div>
                    <div className="text-xs text-gray-400">= 1 Ring Try-On</div>
                  </div>
                  <div className="p-3 bg-gray-700/30 rounded-lg">
                    <div className="text-yellow-400 font-bold text-lg">1 Credit</div>
                    <div className="text-xs text-gray-400">= 1 Necklace Try-On</div>
                  </div>
                  <div className="p-3 bg-gray-700/30 rounded-lg">
                    <div className="text-yellow-400 font-bold text-lg">1 Credit</div>
                    <div className="text-xs text-gray-400">= 1 Earring Pair Try-On</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Business Features - Only show for business plans */}
          {planType === 'business' && (
            <div 
              ref={businessHighlightsRef}
              className="bg-black/50 border border-gray-800 rounded-xl p-8 max-w-6xl mx-auto relative overflow-hidden"
            >
              {/* Animated background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-400/5 to-transparent rounded-full"></div>
              
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center justify-center space-x-2">
                <Store className="h-6 w-6 text-yellow-400" />
                <span>Business Plan Highlights</span>
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="group hover:scale-105 transition-transform cursor-pointer">
                  <Users className="h-8 w-8 text-yellow-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="text-white font-semibold mb-2 group-hover:text-yellow-400 transition-colors">Customer Management</h4>
                  <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">Track customer preferences, purchase history, and engagement metrics</p>
                </div>
                <div className="group hover:scale-105 transition-transform cursor-pointer">
                  <Crown className="h-8 w-8 text-yellow-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="text-white font-semibold mb-2 group-hover:text-yellow-400 transition-colors">Premium Analytics</h4>
                  <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">Detailed insights on sales trends, customer behavior, and ROI</p>
                </div>
                <div className="group hover:scale-105 transition-transform cursor-pointer">
                  <Star className="h-8 w-8 text-yellow-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="text-white font-semibold mb-2 group-hover:text-yellow-400 transition-colors">White Label Solution</h4>
                  <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">Customize the platform with your brand colors, logo, and domain</p>
                </div>
              </div>
            </div>
          )}

          {/* Contact for Enterprise with Ringing Animation */}
          <div className="text-center">
            <p className="text-gray-400 mb-6 text-lg">Need a custom solution for your enterprise?</p>
            <button 
              ref={contactSalesRef}
              className="text-yellow-400 hover:text-black transition-all font-semibold border-2 border-yellow-400 px-8 py-4 rounded-lg hover:bg-yellow-400 relative overflow-hidden group bg-transparent"
            >
              <div className="flex items-center space-x-3 relative z-10">
                <Phone className="h-5 w-5 group-hover:animate-bounce" />
                <span>Contact Sales Team</span>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse group-hover:bg-black"></div>
              </div>
              <div className="absolute inset-0 bg-yellow-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </button>
            <p className="text-gray-500 text-sm mt-3">
              Our sales team is standing by to help you find the perfect solution
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;