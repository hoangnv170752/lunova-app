import React, { useEffect, useRef } from 'react';
import { Star, Quote } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Testimonials: React.FC = () => {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const statsRef = useRef<HTMLDivElement>(null);

  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "Bride",
      rating: 5,
      content: "Lunova created the most beautiful engagement ring for me. The attention to detail and craftsmanship exceeded all my expectations. I couldn't be happier!",
      image: "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=100"
    },
    {
      name: "Michael Chen",
      role: "Collector",
      rating: 5,
      content: "I've been collecting jewelry for years, and Lunova's pieces are exceptional. Their vintage restoration service brought my grandmother's necklace back to life.",
      image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100"
    },
    {
      name: "Emma Rodriguez",
      role: "Fashion Designer",
      rating: 5,
      content: "Working with Lunova on custom pieces for my fashion shows has been incredible. They understand my vision and always deliver beyond expectations.",
      image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100"
    },
    {
      name: "David Thompson",
      role: "Businessman",
      rating: 5,
      content: "The luxury service at Lunova is unmatched. From consultation to delivery, every step was perfect. The cufflinks they made are absolutely stunning.",
      image: "https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=100"
    },
    {
      name: "Lisa Wang",
      role: "Anniversary Gift",
      rating: 5,
      content: "For our 25th anniversary, I wanted something special. Lunova created a custom pendant that tells our love story. It's truly one of a kind.",
      image: "https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=100"
    },
    {
      name: "James Parker",
      role: "Groom",
      rating: 5,
      content: "The wedding bands from Lunova are perfect. The design process was seamless, and the quality is exceptional. Highly recommend for any special occasion.",
      image: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=100"
    }
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial states
      gsap.set(titleRef.current, { opacity: 0, y: 50 });
      gsap.set(cardsRef.current, { opacity: 0, y: 80, rotationX: 15 });
      gsap.set(statsRef.current, { opacity: 0, scale: 0.8 });

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

      // Cards animation with 3D flip effect
      gsap.to(cardsRef.current, {
        opacity: 1,
        y: 0,
        rotationX: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: cardsRef.current[0],
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      });

      // Stats animation
      gsap.to(statsRef.current, {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      });

      // Enhanced hover animations
      cardsRef.current.forEach((card) => {
        if (card) {
          const avatar = card.querySelector('.avatar');
          const stars = card.querySelectorAll('.star');
          const quote = card.querySelector('.quote-icon');
          const content = card.querySelector('.testimonial-content');

          card.addEventListener('mouseenter', () => {
            gsap.to(card, {
              y: -10,
              scale: 1.02,
              duration: 0.3,
              ease: "power2.out"
            });

            gsap.to(avatar, {
              scale: 1.1,
              duration: 0.3,
              ease: "back.out(1.7)"
            });

            gsap.to(stars, {
              scale: 1.2,
              stagger: 0.05,
              duration: 0.3,
              ease: "back.out(1.7)"
            });

            gsap.to(quote, {
              rotation: 10,
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
              duration: 0.3,
              ease: "power2.out"
            });

            gsap.to(avatar, {
              scale: 1,
              duration: 0.3,
              ease: "power2.out"
            });

            gsap.to(stars, {
              scale: 1,
              duration: 0.3,
              ease: "power2.out"
            });

            gsap.to(quote, {
              rotation: 0,
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
    <section ref={sectionRef} id="testimonials" className="py-20 bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/3 left-1/3 w-40 h-40 bg-yellow-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-32 h-32 bg-yellow-400 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            {t('testimonials.title').split(' ')[0]} {t('testimonials.title').split(' ')[1]} <span className="text-yellow-400">{t('testimonials.title').split(' ')[2]} {t('testimonials.title').split(' ')[3]}</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t('testimonials.description')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              ref={addToCardsRefs}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-yellow-400/50 transition-all cursor-pointer relative overflow-hidden group"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="avatar w-12 h-12 rounded-full object-cover mr-4 ring-2 ring-transparent group-hover:ring-yellow-400/50 transition-all"
                  />
                  <div>
                    <h4 className="text-white font-semibold group-hover:text-yellow-400 transition-colors">{testimonial.name}</h4>
                    <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">{testimonial.role}</p>
                  </div>
                </div>
                
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="star h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <div className="relative">
                  <Quote className="quote-icon h-8 w-8 text-yellow-400 opacity-50 mb-2" />
                  <p className="testimonial-content text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">{testimonial.content}</p>
                </div>
              </div>

              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            </div>
          ))}
        </div>
        
        <div ref={statsRef} className="text-center mt-12">
          <div className="flex items-center justify-center space-x-8 text-gray-400">
            <div className="text-center transform hover:scale-110 transition-transform cursor-pointer">
              <div className="text-3xl font-bold text-yellow-400">4.9</div>
              <div className="text-sm">{t('testimonials.rating')}</div>
            </div>
            <div className="text-center transform hover:scale-110 transition-transform cursor-pointer">
              <div className="text-3xl font-bold text-yellow-400">500+</div>
              <div className="text-sm">{t('testimonials.reviews')}</div>
            </div>
            <div className="text-center transform hover:scale-110 transition-transform cursor-pointer">
              <div className="text-3xl font-bold text-yellow-400">98%</div>
              <div className="text-sm">{t('testimonials.satisfaction')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;