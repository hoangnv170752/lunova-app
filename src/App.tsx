import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import BrandsMarquee from './components/BrandsMarquee';
import Collections from './components/Collections';
import Pricing from './components/Pricing';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import ProductDashboard from './components/dashboard/ProductDashboardRefactored';
import TicketDashboard from './components/dashboard/TicketDashboard';
import ShopDashboard from './components/dashboard/ShopDashboard';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import MobileWarning from './components/MobileWarning';

const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <Hero />
      <Services />
      <BrandsMarquee />
      <Collections />
      <Pricing />
      <Testimonials />
      <Contact />
      <Footer />
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  // If auth is still loading, show nothing or a loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }
  
  // Only redirect if we're sure the user is not authenticated
  return user ? <>{children}</> : <Navigate to="/landing" replace />;
};

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
      console.log('Screen width:', window.innerWidth, 'Is mobile:', window.innerWidth < 768);
    };

    checkMobile();

    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route 
          path="/" 
          element={
            isLoading ? (
              <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
              </div>
            ) : user ? (
              isMobileView ? 
              <Navigate to="/mobile-warning" replace /> : 
              <Navigate to="/dashboard/product" replace />
            ) : (
              <Navigate to="/landing" replace />
            )
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              {isMobileView ? <Navigate to="/mobile-warning" replace /> : <Dashboard />}
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/product" 
          element={
            <ProtectedRoute>
              {isMobileView ? <Navigate to="/mobile-warning" replace /> : <ProductDashboard />}
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/ticket" 
          element={
            <ProtectedRoute>
              {isMobileView ? <Navigate to="/mobile-warning" replace /> : <TicketDashboard />}
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/shop" 
          element={
            <ProtectedRoute>
              {isMobileView ? <Navigate to="/mobile-warning" replace /> : <ShopDashboard />}
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/login" 
          element={
            isLoading ? (
              <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
              </div>
            ) : user ? (isMobileView ? <Navigate to="/mobile-warning" replace /> : <Navigate to="/dashboard/product" replace />) : <Login />
          } 
        />
        <Route 
          path="/register" 
          element={
            isLoading ? (
              <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
              </div>
            ) : user ? (isMobileView ? <Navigate to="/mobile-warning" replace /> : <Navigate to="/dashboard/product" replace />) : <Register />
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            isLoading ? (
              <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
              </div>
            ) : user ? (isMobileView ? <Navigate to="/mobile-warning" replace /> : <Navigate to="/dashboard/product" replace />) : <ForgotPassword />
          } 
        />
        <Route 
          path="/mobile-warning" 
          element={
            <ProtectedRoute>
              <MobileWarning />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;