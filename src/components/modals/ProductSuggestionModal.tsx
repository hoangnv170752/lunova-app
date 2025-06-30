import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Volume2, ShoppingBag } from 'lucide-react';
import gsap from 'gsap';
import { useLanguage } from '../../contexts/LanguageContext';
import { Link } from 'react-router-dom';

interface ProductSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProductSuggestionModal: React.FC<ProductSuggestionModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const modalOverlayRef = useRef<HTMLDivElement>(null);
  const voiceAnimationRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore - SpeechRecognition API is not fully typed in TypeScript
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setUserQuery(transcript);
          handleGetSuggestion(transcript);
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (speechSynthesis && speechSynthesisRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, []);
  
  // GSAP animation for modal and show greeting when opened
  useEffect(() => {
    if (isOpen && modalRef.current && modalOverlayRef.current) {
      // Animate modal overlay
      gsap.fromTo(
        modalOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      );
      
      // Animate modal
      gsap.fromTo(
        modalRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
      );
      
      // Show greeting message when modal opens
      const userLanguage = t('languageCode') || 'en';
      const greetings = {
        en: "Hello! I'm Lunova's virtual assistant. How can I help you find the perfect product today?",
        vi: "Xin chào! Tôi là trợ lý ảo của Lunova. Tôi có thể giúp bạn tìm sản phẩm phù hợp hôm nay như thế nào?"
      };
      
      const greeting = userLanguage === 'vi' ? greetings.vi : greetings.en;
      setSuggestion(greeting);
      speakText(greeting);
    }
  }, [isOpen, t]);
  
  // Voice animation effect
  useEffect(() => {
    if (voiceAnimationRef.current) {
      if (isSpeaking || isListening) {
        // Create voice wave animation
        const bars = voiceAnimationRef.current.querySelectorAll('.voice-bar');
        
        bars.forEach((bar) => {
          animateBar(bar as HTMLElement);
        });
      } else {
        // Reset animation
        const bars = voiceAnimationRef.current.querySelectorAll('.voice-bar');
        bars.forEach((bar) => {
          gsap.killTweensOf(bar);
          gsap.set(bar, { height: '15px' });
        });
      }
    }
  }, [isSpeaking, isListening]);
  
  // Function to animate individual voice bars
  const animateBar = (bar: HTMLElement) => {
    const randomHeight = () => Math.floor(Math.random() * 30) + 5; // Random height between 5px and 35px
    const randomDuration = () => Math.random() * 0.5 + 0.2; // Random duration between 0.2s and 0.7s
    
    gsap.to(bar, {
      height: `${randomHeight()}px`,
      duration: randomDuration(),
      ease: "power1.inOut",
      onComplete: () => {
        if (isSpeaking || isListening) {
          animateBar(bar);
        }
      }
    });
  };
  
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };
  
  const handleClose = () => {
    // Stop any ongoing speech or recognition
    if (speechSynthesis && speechSynthesisRef.current) {
      speechSynthesis.cancel();
    }
    
    if (recognitionRef.current && isListening) {
      recognitionRef.current.abort();
      setIsListening(false);
    }
    
    setIsSpeaking(false);
    onClose();
  };
  
  const handleStartListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      alert('Speech recognition is not supported in your browser.');
    }
  };
  
  const handleStopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.abort();
      setIsListening(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserQuery(e.target.value);
  };
  
  const handleSubmitQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (userQuery.trim()) {
      handleGetSuggestion(userQuery);
    }
  };
  
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);
  
  const handleGetSuggestion = async (query: string) => {
    setIsLoading(true);
    
    try {
      // Get user's language from the language context
      const userLanguage = 'en';
      
      // Call the chatbot API
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chatbot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: query,
          language: userLanguage
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Chatbot response:', data);
      
      // Update state with response data
      setSuggestion(data.response);
      setSuggestedProducts(data.suggested_products || []);
      
      // Store detected language for potential future use
      // (removing the unused variable warning)
      
      // Speak the suggestion if text-to-speech is enabled
      speakText(data.response);
    } catch (error) {
      console.error('Error getting product suggestion:', error);
      setSuggestion('Sorry, I could not generate a suggestion at this time. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Get available voices and set a good one if available
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Samantha') || 
        voice.name.includes('Female')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      // Set events
      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
      };
      
      // Store reference and speak
      speechSynthesisRef.current = utterance;
      speechSynthesis.speak(utterance);
    } else {
      console.error('Speech synthesis not supported');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
        ref={modalOverlayRef}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={handleBackdropClick}
    >
        <div
            className="bg-gray-900 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl shadow-lg p-6"
            onClick={(e) => e.stopPropagation()} // Prevent click from bubbling
        >
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h2 className="text-xl font-semibold text-white">{t('product.suggestions.title') || 'Product Suggestions'}</h2>
                <button 
                    onClick={handleClose}
                    className="p-1 rounded-full hover:bg-gray-800 transition-colors"
                >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Modal content */}
        <div className="p-6">
          {/* Voice animation component */}
          <div className="mb-6 flex justify-center">
            <div 
              ref={voiceAnimationRef}
              className="voice-animation flex items-end space-x-1 h-40 w-64 p-4 bg-gray-800 rounded-lg"
            >
              {/* Voice bars */}
              {Array.from({ length: 12 }).map((_, index) => (
                <div 
                  key={index}
                  className="voice-bar bg-yellow-400 w-3 h-4 rounded-t-sm"
                  style={{ 
                    opacity: isSpeaking || isListening ? 1 : 0.5,
                    transition: 'opacity 0.3s ease'
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          {/* Status text */}
          <div className="text-center mb-6">
            {isListening && <p className="text-yellow-400">{t('product.suggestions.listening') || 'Listening...'}</p>}
            {isLoading && <p className="text-blue-400">{t('product.suggestions.thinking') || 'Thinking...'}</p>}
            {isSpeaking && <p className="text-green-400">{t('product.suggestions.speaking') || 'Speaking...'}</p>}
          </div>
          
          {/* Suggestion display */}
          {suggestion && (
            <div className="mb-6">
              <h3 className="text-sm text-gray-400 mb-1">{t('product.suggestions.suggestion') || 'Suggestion:'}</h3>
              <p className="text-white bg-gray-800 p-3 rounded-lg">{suggestion}</p>
            </div>
          )}
          
          {/* Suggested Products */}
          {suggestedProducts && suggestedProducts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm text-gray-400 mb-2">{t('product.suggestions.suggestedProducts') || 'Suggested Products:'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
                {suggestedProducts.map((item, index) => (
                  <Link 
                    to={`/product/${item.product.id}`} 
                    key={`${item.product.id}-${index}`}
                    className="flex bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors"
                  >
                    {/* Product Image */}
                    {item.images && item.images.length > 0 && (
                      <div className="w-24 h-24 flex-shrink-0">
                        <img 
                          src={item.images[0].image_url} 
                          alt={item.images[0].alt_text || item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Product Details */}
                    <div className="p-3 flex-1">
                      <h4 className="text-white text-sm font-medium line-clamp-2">{item.product.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-yellow-400 text-sm">
                          ${parseFloat(item.product.price).toFixed(2)}
                          {item.product.sale_price && parseFloat(item.product.sale_price) > 0 && (
                            <span className="text-gray-400 line-through ml-2">
                              ${parseFloat(item.product.sale_price).toFixed(2)}
                            </span>
                          )}
                        </p>
                        <ShoppingBag className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Manual input form */}
          <form onSubmit={handleSubmitQuery} className="mb-6">
            <div className="flex space-x-2">
              <input
                type="text"
                value={userQuery}
                onChange={handleInputChange}
                placeholder={t('product.suggestions.searchPlaceholder') || "Type what you're looking for..."}
                className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                disabled={isListening || isLoading}
              />
              <button
                type="submit"
                disabled={!userQuery.trim() || isLoading}
                className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('product.suggestions.search') || 'Search'}
              </button>
            </div>
          </form>
          
          {/* Action buttons */}
          <div className="flex justify-center space-x-4">
            {!isListening ? (
              <button
                onClick={handleStartListening}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-yellow-400 text-black hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Mic className="h-5 w-5" />
                <span>{t('product.suggestions.askForSuggestion') || 'Ask for Suggestion'}</span>
              </button>
            ) : (
              <button
                onClick={handleStopListening}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <X className="h-5 w-5" />
                <span>{t('product.suggestions.stopListening') || 'Stop Listening'}</span>
              </button>
            )}
            
            {suggestion && !isSpeaking && (
              <button
                onClick={() => speakText(suggestion)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                <Volume2 className="h-5 w-5" />
                <span>{t('product.suggestions.speakAgain') || 'Speak Again'}</span>
              </button>
            )}
            
            {isSpeaking && (
              <button
                onClick={() => {
                  if (speechSynthesis && speechSynthesisRef.current) {
                    speechSynthesis.cancel();
                    setIsSpeaking(false);
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <X className="h-5 w-5" />
                <span>{t('product.suggestions.stopSpeaking') || 'Stop Speaking'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSuggestionModal;
