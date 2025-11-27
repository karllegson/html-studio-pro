import { useNavigate } from 'react-router-dom';
import { FileText, Upload, LogIn, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { TaskStatsWidget } from '@/components/TaskStatsWidget';
import { auth } from '@/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { LoginModal } from '@/components/LoginModal';
import { MotivationalQuote } from '@/components/MotivationalQuote';

export default function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Set page title
  useEffect(() => {
    document.title = 'HTML Studio Pro';
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
    <div className="min-h-screen w-full bg-background">
      {/* Navbar */}
      <nav className="border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between w-full">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <img src="/favicon.svg" alt="Logo" className="w-6 h-6 sm:w-8 sm:h-8" />
              <span className="text-base sm:text-xl font-bold hidden sm:inline">HTML Studio Pro</span>
              <span className="text-base font-bold sm:hidden">Studio</span>
            </div>
            
            {/* Nav Links - Hidden on mobile, shown on tablet+ */}
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Dashboard
              </button>
              <button 
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Tools
              </button>
              <button 
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Stats
              </button>
              <button 
                onClick={() => navigate('/earnings')}
                className="text-sm font-medium hover:text-primary transition-colors"
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

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-3 border-t pt-4">
              <button 
                onClick={() => {
                  navigate('/dashboard');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors"
              >
                Dashboard
              </button>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors"
              >
                Tools
              </button>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors"
              >
                Stats
              </button>
              <button 
                onClick={() => {
                  navigate('/earnings');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors"
              >
                Earnings
              </button>
              <div className="pt-2">
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
          )}
        </div>
      </nav>

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
