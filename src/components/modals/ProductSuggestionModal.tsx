import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Volume2 } from 'lucide-react';
import gsap from 'gsap';
import { useLanguage } from '../../contexts/LanguageContext';

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
  
  // GSAP animation for modal
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
    }
  }, [isOpen]);
  
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
  
  const handleGetSuggestion = async (query: string) => {
    setIsLoading(true);
    
    try {
      // Mock API call - replace with actual API call to your backend
      // const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/product-suggestions`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ query })
      // });
      // const data = await response.json();
      // setSuggestion(data.suggestion);
      
      console.log(`Getting suggestion for query: ${query}`);
      
      // Mock response for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockSuggestions = [
        "Based on your interests, I recommend our premium wireless headphones with noise cancellation.",
        "You might enjoy our new collection of smart home devices that integrate with your existing setup.",
        "Our latest fashion line includes sustainable materials that match your previous purchases.",
        "Consider our limited edition gaming accessories with customizable RGB lighting.",
        "Our organic skincare products have received excellent reviews from customers with similar preferences."
      ];
      
      const randomSuggestion = mockSuggestions[Math.floor(Math.random() * mockSuggestions.length)];
      setSuggestion(randomSuggestion);
      
      // Speak the suggestion
      speakText(randomSuggestion);
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
        ref={modalRef}
        className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-800"
        onClick={(e) => e.stopPropagation()}
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
