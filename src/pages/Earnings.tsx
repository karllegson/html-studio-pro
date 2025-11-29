import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingUp, Clock, AlertCircle, LogIn, LogOut, Menu, X, Loader2, RefreshCw, ArrowLeft } from 'lucide-react';
import { auth } from '@/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { LoginModal } from '@/components/LoginModal';
import { fetchEarningsData, PersonEarnings as SheetPersonEarnings, generatePayPeriods } from '@/utils/googleSheets';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSheetName } from '@/components/SheetNameConfig';

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
  const location = useLocation();
  
  // Check if app is in standalone mode (PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true ||
                       document.referrer.includes('android-app://');
  
  // Show back button only in standalone mode and if not on home page
  const canGoBack = isStandalone && location.pathname !== '/';
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<PersonEarnings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSheetName, setCurrentSheetName] = useState<string>('');
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<string>('');
  const [availablePayPeriods, setAvailablePayPeriods] = useState<string[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<{ period: string; amount: number }[]>([]);

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

  // Initialize pay periods
  useEffect(() => {
    const defaultSheet = getSheetName();
    setCurrentSheetName(defaultSheet);
    setSelectedPayPeriod(defaultSheet);
    const periods = generatePayPeriods(defaultSheet);
    setAvailablePayPeriods(periods);
  }, []);

  // Load earnings data for selected pay period
  const loadEarnings = async (payPeriod?: string) => {
    setLoading(true);
    setError(null);
    
    const targetPeriod = payPeriod || selectedPayPeriod;
    const data = await fetchEarningsData(targetPeriod);
    
    if (data) {
      setEarnings(data.earnings);
      setCurrentSheetName(data.currentSheetName);
    } else {
      setError('Unable to load earnings data');
    }
    
    setLoading(false);
  };

  // Load earnings when pay period changes
  useEffect(() => {
    if (selectedPayPeriod) {
      loadEarnings(selectedPayPeriod);
    }
  }, [selectedPayPeriod]);

  // Handle pay period selection
  const handlePayPeriodChange = (period: string) => {
    setSelectedPayPeriod(period);
  };

  // Load monthly earnings for the past year
  const loadMonthlyEarnings = async (personName: string) => {
    if (!availablePayPeriods.length) return;
    
    const monthlyData: { period: string; amount: number }[] = [];
    
    // Fetch earnings for the last 12 pay periods
    const periodsToFetch = availablePayPeriods.slice(0, 12);
    
    for (const period of periodsToFetch) {
      try {
        const data = await fetchEarningsData(period);
        if (data) {
          const person = data.earnings.find(p => p.name === personName);
          // Include all periods, even if amount is 0, to show complete timeline
          monthlyData.push({
            period: period.replace('Posting ', ''), // Just show the number
            amount: person ? person.invoiceSummary : 0
          });
        } else {
          // If data fetch failed, still include the period with 0 amount
          monthlyData.push({
            period: period.replace('Posting ', ''),
            amount: 0
          });
        }
      } catch (error) {
        console.error(`Error fetching earnings for ${period}:`, error);
        // Include period even if fetch failed
        monthlyData.push({
          period: period.replace('Posting ', ''),
          amount: 0
        });
      }
    }
    
    // Reverse to show oldest to newest
    setMonthlyEarnings(monthlyData.reverse());
  };

  // Load monthly earnings when person is selected
  useEffect(() => {
    if (selectedPerson && availablePayPeriods.length > 0 && !loading) {
      loadMonthlyEarnings(selectedPerson);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPerson, availablePayPeriods.length]);

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
            <Button variant="outline" onClick={() => loadEarnings(selectedPayPeriod)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : !selectedPerson ? (
          <div>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Select Team Member</h1>
                  <p className="text-muted-foreground">Choose a team member to view their earnings</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => loadEarnings(selectedPayPeriod)} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              {/* Pay Period Selector */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-muted-foreground">Pay Period:</label>
                <Select value={selectedPayPeriod} onValueChange={handlePayPeriodChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePayPeriods.map((period) => (
                      <SelectItem key={period} value={period}>
                        {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
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
              
              {/* Pay Period Selector */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-muted-foreground">View Period:</label>
                <Select value={selectedPayPeriod} onValueChange={handlePayPeriodChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePayPeriods.map((period) => (
                      <SelectItem key={period} value={period}>
                        {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

        {/* Summary Cards - Only for selected person */}
        <div className="flex gap-3 mb-8 max-w-xl">
          {(() => {
            const person = earnings.find(p => p.name === selectedPerson);
            if (!person) return null;
            
            // Check if viewing current period or past period
            const currentPeriod = getSheetName();
            const isCurrentPeriod = selectedPayPeriod === currentPeriod;
            
            return (
              <>
              {isCurrentPeriod ? (
                <>
                  <Card className="flex-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
                      <CardTitle className="text-xs font-medium">Current Period</CardTitle>
                      <Clock className="h-3 w-3 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="text-xl font-bold">${person.currentPeriod.toFixed(2)}</div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{currentSheetName}</p>
                    </CardContent>
                  </Card>

                  <Card className="flex-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
                      <CardTitle className="text-xs font-medium">Invoice Summary</CardTitle>
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="text-xl font-bold">${person.invoiceSummary.toFixed(2)}</div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">With all extras included</p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="flex-1">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
                    <CardTitle className="text-xs font-medium">Invoice Total</CardTitle>
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="text-xl font-bold">${person.invoiceSummary.toFixed(2)}</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{selectedPayPeriod} - With all extras included</p>
                  </CardContent>
                </Card>
              )}
              </>
            );
          })()}
        </div>

        {/* Monthly Earnings Chart */}
        {(() => {
          const person = earnings.find(p => p.name === selectedPerson);
          if (!person || monthlyEarnings.length === 0) return null;

          const maxAmount = Math.max(...monthlyEarnings.map(m => m.amount), 1);

          return (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Earnings Per Month (Past Year)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between gap-2 sm:gap-4 h-64 overflow-x-auto pb-4">
                  {monthlyEarnings.map((data, index) => {
                    const heightPercent = (data.amount / maxAmount) * 100;
                    return (
                      <div key={index} className="flex-1 min-w-[60px] sm:min-w-[80px] flex flex-col items-center gap-2">
                        <div className="relative w-full flex items-end justify-center" style={{ height: '200px' }}>
                          <div 
                            className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all hover:opacity-80 flex items-end justify-center pb-2"
                            style={{ height: `${Math.max(heightPercent, 10)}%`, minHeight: '30px' }}
                          >
                            <span className="text-white font-bold text-xs sm:text-sm">${data.amount.toFixed(0)}</span>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground text-center">{data.period}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Showing invoice totals from the past {monthlyEarnings.length} pay periods
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

