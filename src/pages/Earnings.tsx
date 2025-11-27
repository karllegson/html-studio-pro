import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Clock, AlertCircle, LogIn, LogOut, Menu, X, Loader2, RefreshCw } from 'lucide-react';
import { auth } from '@/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { LoginModal } from '@/components/LoginModal';
import { fetchEarningsData, PersonEarnings as SheetPersonEarnings } from '@/utils/googleSheets';

interface PersonEarnings {
  name: string;
  currentPeriod: number;
  invoiceSummary: number;
}

// Avatar colors for each person
const avatarColors: Record<string, string> = {
  'Len': 'from-blue-500 to-purple-500',
  'Sel': 'from-green-500 to-teal-500',
  'Daniel': 'from-yellow-500 to-orange-500',
  'Abi': 'from-red-500 to-pink-500'
};

export default function Earnings() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<PersonEarnings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSheetName, setCurrentSheetName] = useState<string>('');

  useEffect(() => {
    document.title = 'Earnings - HTML Studio Pro';
  }, []);

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Load earnings data
  const loadEarnings = async () => {
    setLoading(true);
    setError(null);
    
    const data = await fetchEarningsData();
    
    if (data) {
      setEarnings(data.earnings);
      setCurrentSheetName(data.currentSheetName);
    } else {
      setError('Unable to load earnings data');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadEarnings();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadEarnings, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleAuthAction = async () => {
    if (isLoggedIn) {
      await signOut(auth);
    } else {
      setShowLoginModal(true);
    }
  };

  const totalInvoice = earnings.reduce((sum, person) => sum + person.invoiceSummary, 0);
  const totalCurrentPeriod = earnings.reduce((sum, person) => sum + person.currentPeriod, 0);

  return (
    <div className="min-h-screen bg-background">
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
                className="text-sm font-medium text-primary transition-colors"
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
                className="block w-full text-left px-4 py-2 text-sm font-medium text-primary hover:bg-accent rounded-lg transition-colors"
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

      {/* Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
        
        {/* Loading State */}
        {loading && !earnings.length ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <Button variant="outline" onClick={loadEarnings}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : !selectedPerson ? (
          <div>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Select Team Member</h1>
                <p className="text-muted-foreground">Choose a team member to view their earnings</p>
              </div>
              <Button variant="ghost" size="sm" onClick={loadEarnings} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
              {earnings.map((person) => (
                <button
                  key={person.name}
                  onClick={() => setSelectedPerson(person.name)}
                  className="border rounded-lg p-3 text-center hover:border-primary transition-all hover:shadow bg-card"
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[person.name]} flex items-center justify-center mx-auto mb-2`}>
                    <span className="text-base font-bold text-white">{person.name[0]}</span>
                  </div>
                  <h3 className="text-sm font-bold mb-1">{person.name}</h3>
                  <p className="text-[10px] text-muted-foreground mb-0.5">Current Period</p>
                  <p className="text-base font-bold text-emerald-400">${person.currentPeriod.toFixed(2)}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Header with Back Button */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                  {selectedPerson}'s Earnings
                </h1>
                <p className="text-muted-foreground">
                  Pay Period: {currentSheetName}
                </p>
              </div>
              <Button variant="outline" onClick={() => setSelectedPerson(null)}>
                ← Back to Team
              </Button>
            </div>

        {/* Summary Cards - Only for selected person */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-2xl">
          {(() => {
            const person = earnings.find(p => p.name === selectedPerson);
            if (!person) return null;
            
            return (
              <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Period</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${person.currentPeriod.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">{currentSheetName}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Invoice Summary</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${person.invoiceSummary.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">With all extras included</p>
                </CardContent>
              </Card>
              </>
            );
          })()}
        </div>

        {/* Earnings Breakdown Chart */}
        {(() => {
          const person = earnings.find(p => p.name === selectedPerson);
          if (!person) return null;
          
          const breakdown = [
            { label: 'Current Period', amount: person.currentPeriod, color: 'from-blue-600 to-blue-400' },
            { label: 'Invoice Total', amount: person.invoiceSummary, color: 'from-emerald-600 to-emerald-400' }
          ];

          const maxAmount = Math.max(person.currentPeriod, person.invoiceSummary, 1);

          return (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Earnings Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-center gap-12 h-64">
                  {breakdown.map((item, index) => {
                    const heightPercent = (item.amount / maxAmount) * 100;
                    return (
                      <div key={index} className="w-40 flex flex-col items-center gap-3">
                        <div className="relative w-full flex items-end justify-center" style={{ height: '200px' }}>
                          <div 
                            className={`w-full bg-gradient-to-t ${item.color} rounded-t transition-all hover:opacity-80 flex items-end justify-center pb-2`}
                            style={{ height: `${Math.max(heightPercent, 15)}%` }}
                          >
                            <span className="text-white font-bold text-sm">${item.amount.toFixed(2)}</span>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground text-center">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Invoice total includes all extras and bonuses
                </p>
              </CardContent>
            </Card>
          );
        })()}

        {/* Payment Schedule Info */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Period 1 (11th - 25th)</h4>
                <p className="text-sm text-muted-foreground">Payable: 1st of the month</p>
                <p className="text-sm text-muted-foreground">Invoice Due: 25th by end of business</p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Period 2 (26th - 10th)</h4>
                <p className="text-sm text-muted-foreground">Payable: 15th of the month</p>
                <p className="text-sm text-muted-foreground">Invoice Due: 10th by end of business</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </>
        )}
      </div>
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}

