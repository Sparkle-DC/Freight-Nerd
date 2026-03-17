import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { signInWithGoogle, logOut } from '../firebase';
import { Truck, LogOut, LayoutDashboard, Calculator, Box, ShieldAlert, DollarSign, Menu, X, ChevronDown, Wrench, FileWarning, Network } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 flex flex-col">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl tracking-tight">
              <Truck className="w-6 h-6" />
              <span>FreightNerd</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <div className="relative group">
              <button className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 py-2 transition-colors">
                <Wrench className="w-4 h-4" />
                Tools
                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 w-56 bg-white border border-zinc-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 translate-y-2 group-hover:translate-y-0">
                <div className="p-2 flex flex-col gap-1">
                  <Link to="/" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${location.pathname === '/' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                    <Calculator className="w-4 h-4" /> Fuel Surcharge
                  </Link>
                  <Link to="/ltl" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${location.pathname === '/ltl' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                    <Box className="w-4 h-4" /> LTL Density
                  </Link>
                  <Link to="/carrier" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${location.pathname === '/carrier' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                    <ShieldAlert className="w-4 h-4" /> Carrier Vetting
                  </Link>
                  <Link to="/landed-cost" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${location.pathname === '/landed-cost' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                    <DollarSign className="w-4 h-4" /> Landed Cost
                  </Link>
                  <Link to="/dnd" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${location.pathname === '/dnd' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                    <FileWarning className="w-4 h-4" /> D&D Auditor
                  </Link>
                  <Link to="/matchmaker" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${location.pathname === '/matchmaker' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                    <Network className="w-4 h-4" /> 3PL Matchmaker
                  </Link>
                </div>
              </div>
            </div>
            
            {user && (
              <Link 
                to="/dashboard" 
                className={`text-sm font-medium transition-colors ${location.pathname.includes('dashboard') ? 'text-indigo-600' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                <span className="flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4" /> Dashboard</span>
              </Link>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {!loading && (
              user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-zinc-600 hidden sm:inline-block">{user.email}</span>
                  <button 
                    onClick={logOut}
                    className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors rounded-full hover:bg-zinc-100"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={signInWithGoogle}
                  className="text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  Sign In
                </button>
              )
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 bg-white absolute w-full shadow-xl z-50 left-0 top-16 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col p-4 space-y-1">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-3 mt-2">Tools</div>
              <Link to="/" className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors ${location.pathname === '/' ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-700 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                <Calculator className={location.pathname === '/' ? 'text-indigo-600 w-5 h-5' : 'text-zinc-400 w-5 h-5'} /> Fuel Surcharge
              </Link>
              <Link to="/ltl" className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors ${location.pathname === '/ltl' ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-700 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                <Box className={location.pathname === '/ltl' ? 'text-indigo-600 w-5 h-5' : 'text-zinc-400 w-5 h-5'} /> LTL Density
              </Link>
              <Link to="/carrier" className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors ${location.pathname === '/carrier' ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-700 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                <ShieldAlert className={location.pathname === '/carrier' ? 'text-indigo-600 w-5 h-5' : 'text-zinc-400 w-5 h-5'} /> Carrier Vetting
              </Link>
              <Link to="/landed-cost" className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors ${location.pathname === '/landed-cost' ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-700 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                <DollarSign className={location.pathname === '/landed-cost' ? 'text-indigo-600 w-5 h-5' : 'text-zinc-400 w-5 h-5'} /> Landed Cost
              </Link>
              <Link to="/dnd" className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors ${location.pathname === '/dnd' ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-700 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                <FileWarning className={location.pathname === '/dnd' ? 'text-indigo-600 w-5 h-5' : 'text-zinc-400 w-5 h-5'} /> D&D Auditor
              </Link>
              <Link to="/matchmaker" className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors ${location.pathname === '/matchmaker' ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-700 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                <Network className={location.pathname === '/matchmaker' ? 'text-indigo-600 w-5 h-5' : 'text-zinc-400 w-5 h-5'} /> 3PL Matchmaker
              </Link>
              
              {user && (
                <>
                  <div className="h-px bg-zinc-100 my-3 mx-3"></div>
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-3">Account</div>
                  <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors ${location.pathname.includes('dashboard') ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-700 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                    <LayoutDashboard className={location.pathname.includes('dashboard') ? 'text-indigo-600 w-5 h-5' : 'text-zinc-400 w-5 h-5'} /> Dashboard
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <Outlet />
      </main>
      
      <footer className="bg-white border-t border-zinc-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-zinc-500">
          <p>&copy; {new Date().getFullYear()} FreightNerd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
