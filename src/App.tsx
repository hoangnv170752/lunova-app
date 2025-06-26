import React, { useState } from 'react';
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
import ProductDashboard from './components/dashboard/ProductDashboard';
import TicketDashboard from './components/dashboard/TicketDashboard';
import ShopDashboard from './components/dashboard/ShopDashboard';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';

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
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/landing" replace />;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route 
          path="/" 
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/landing" replace />
            )
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/product" 
          element={
            <ProtectedRoute>
              <ProductDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/ticket" 
          element={
            <ProtectedRoute>
              <TicketDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/shop" 
          element={
            <ProtectedRoute>
              <ShopDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <Login />
          } 
        />
        <Route 
          path="/register" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <Register />
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />
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