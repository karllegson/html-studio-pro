import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, Upload, LogIn, LogOut, Menu, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TaskStatsWidget } from '@/components/TaskStatsWidget';
import { auth } from '@/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { LoginModal } from '@/components/LoginModal';
import { MotivationalQuote } from '@/components/MotivationalQuote';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Check if app is in standalone mode (PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true ||
                       document.referrer.includes('android-app://');
  
  // Show back button only in standalone mode and if not on home page
  const canGoBack = isStandalone && location.pathname !== '/';

  // Set page title
  useEffect(() => {
    document.title = 'HTML Studio Pro';
  }, []);

  // Hide scrollbar on mobile
  useEffect(() => {
    if (window.innerWidth <= 768) {
      document.body.classList.add('hide-scrollbar-mobile');
      document.documentElement.classList.add('hide-scrollbar-mobile');
    }
    
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        document.body.classList.add('hide-scrollbar-mobile');
        document.documentElement.classList.add('hide-scrollbar-mobile');
      } else {
        document.body.classList.remove('hide-scrollbar-mobile');
        document.documentElement.classList.remove('hide-scrollbar-mobile');
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.classList.remove('hide-scrollbar-mobile');
      document.documentElement.classList.remove('hide-scrollbar-mobile');
    };
  }, []);

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthAction = async () => {
    if (isLoggedIn) {
      await signOut(auth);
      // Stay on homepage after logout
    } else {
      // Show login modal
      setShowLoginModal(true);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background hide-scrollbar-mobile">
      {/* Navbar */}
      <nav className="border-b">
        <div className={cn("max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4", canGoBack && "relative")}>
          <div className="flex items-center justify-between w-full">
            {/* Left side: Back button (if can go back) */}
            <div className="flex items-center">
              {canGoBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 p-0"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}
            </div>
            
            {/* Logo - centered if back button appears, otherwise left */}
            <div className={cn(
              "flex items-center gap-2 sm:gap-3 cursor-pointer flex-shrink-0",
              canGoBack && "absolute left-1/2 transform -translate-x-1/2"
            )} onClick={() => navigate('/')}>
              <img src="/favicon.svg" alt="Logo" className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
              <span className="text-base sm:text-xl font-bold whitespace-nowrap">HTML Studio Pro</span>
            </div>
            
            {/* Nav Links - Hidden on mobile, shown on tablet+ */}
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
              <button 
                onClick={() => navigate('/')}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/' 
                    ? 'text-primary font-semibold' 
                    : 'hover:text-primary'
                }`}
              >
                Home
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/dashboard' 
                    ? 'text-primary font-semibold' 
                    : 'hover:text-primary'
                }`}
              >
                Dashboard
              </button>
              <button 
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/tools' 
                    ? 'text-primary font-semibold' 
                    : 'hover:text-primary'
                }`}
              >
                Tools
              </button>
              <button 
                onClick={() => navigate('/earnings')}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/earnings' 
                    ? 'text-primary font-semibold' 
                    : 'hover:text-primary'
                }`}
              >
                Earnings
              </button>
            </div>
            
            {/* Right side - Desktop Login or Mobile Hamburger */}
            <div className="flex items-center">
              {/* Desktop Login Button */}
              <Button variant="outline" size="sm" onClick={handleAuthAction} className="hidden md:flex">
                {isLoggedIn ? (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </>
                )}
              </Button>

              {/* Mobile Hamburger Menu */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sidebar */}
          <div className="fixed inset-y-0 right-0 w-72 bg-card border-l border-border z-50 md:hidden shadow-xl mobile-sidebar-right">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <img src="/favicon.svg" alt="Logo" className="w-6 h-6 flex-shrink-0" />
                  <span className="text-base font-bold whitespace-nowrap truncate">HTML Studio Pro</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0 -mr-2"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                <button 
                  onClick={() => {
                    navigate('/');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-between ${
                    location.pathname === '/' 
                      ? 'bg-primary/20 text-primary font-semibold' 
                      : 'hover:bg-accent text-foreground'
                  }`}
                >
                  <span>Home</span>
                  {location.pathname === '/' && (
                    <div className="w-1 h-6 bg-primary rounded-full" />
                  )}
                </button>
                <button 
                  onClick={() => {
                    navigate('/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-between ${
                    location.pathname === '/dashboard' 
                      ? 'bg-primary/20 text-primary font-semibold' 
                      : 'hover:bg-accent text-foreground'
                  }`}
                >
                  <span>Dashboard</span>
                  {location.pathname === '/dashboard' && (
                    <div className="w-1 h-6 bg-primary rounded-full" />
                  )}
                </button>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-between ${
                    location.pathname === '/tools' 
                      ? 'bg-primary/20 text-primary font-semibold' 
                      : 'hover:bg-accent text-foreground'
                  }`}
                >
                  <span>Tools</span>
                  {location.pathname === '/tools' && (
                    <div className="w-1 h-6 bg-primary rounded-full" />
                  )}
                </button>
                <button 
                  onClick={() => {
                    navigate('/earnings');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-between ${
                    location.pathname === '/earnings' 
                      ? 'bg-primary/20 text-primary font-semibold' 
                      : 'hover:bg-accent text-foreground'
                  }`}
                >
                  <span>Earnings</span>
                  {location.pathname === '/earnings' && (
                    <div className="w-1 h-6 bg-primary rounded-full" />
                  )}
                </button>
              </nav>

              {/* Footer with Logout */}
              <div className="p-4 border-t border-border">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => {
                    handleAuthAction();
                    setMobileMenuOpen(false);
                  }}
                >
                  {isLoggedIn ? (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Hero Section */}
      <section className="px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <MotivationalQuote />
        </div>
      </section>

      {/* Task Stats Section */}
      <section className="px-4 sm:px-6 pb-6 sm:pb-8">
        <div className="max-w-6xl mx-auto">
          <TaskStatsWidget />
        </div>
      </section>

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

    </div>
  );
}
