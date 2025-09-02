'use client';

import { logout } from '../lib/firebase';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function Navbar({ user }) {
  const router = useRouter();
  const [theme, setTheme] = useState('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      const next = stored === 'light' || stored === 'dark' ? stored : 'dark';
      setTheme(next);
      document.documentElement.setAttribute('data-theme', next);
    } catch (_) {}
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('theme', next);
    } catch (_) {}
    document.documentElement.setAttribute('data-theme', next);
  }, [theme]);

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('userInfo');
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-border/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo with Glass Effect */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg mr-3">
                  <img 
                    src="/favicon.ico"
                    alt="Prognosis Logo"
                    className="h-6 w-6 sm:h-7 sm:w-7 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'block';
                    }}
                  />
                  <svg 
                    className="h-5 w-5 sm:h-6 sm:w-6 text-medical" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ display: 'none' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                  </svg>
                </div>
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent tracking-tight">Prognosis</span>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden lg:ml-8 lg:flex lg:space-x-1">
                <a
                  href="/dashboard"
                  className="px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-elevated/80 transition-all duration-300 relative group"
                >
                  Dashboard
                </a>
                <a
                  href="/leaderboard"
                  className="px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-elevated/80 transition-all duration-300 relative group"
                >
                  Leaderboard
                </a>
                <a
                  href="/profile"
                  className="px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-elevated/80 transition-all duration-300 relative group"
                >
                  Profile
                </a>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="p-2 rounded-xl bg-elevated/60 hover:bg-elevated border border-border/40 hover:border-border text-foreground transition-all duration-300 group"
              >
                {theme === 'dark' ? (
                  <svg className="h-4 w-4 transform group-hover:rotate-180 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0-1.414 1.414M7.05 16.95l-1.414 1.414" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 transform group-hover:rotate-180 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3A7 7 0 0021 12.79z" />
                  </svg>
                )}
              </button>
              
              {/* User Profile - Consolidated */}
              {user && (
                <div className="flex items-center space-x-3">
                  <a 
                    href="/profile"
                    className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-elevated/60 border border-border/40 hover:bg-elevated transition-all duration-300"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || user.email || 'User'}
                        className="h-7 w-7 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`h-7 w-7 rounded-full bg-gradient-to-br from-medical to-medical-dark flex items-center justify-center text-white text-xs font-semibold ${
                        user.photoURL ? 'hidden' : 'flex'
                      }`}
                    >
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground truncate max-w-32">
                      {user.displayName || user.username || user.email}
                    </span>
                  </a>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-elevated/60 hover:bg-elevated border border-border/40 hover:border-border rounded-xl transition-all duration-300"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="p-2 rounded-xl bg-elevated/60 border border-border/40 text-foreground transition-all duration-300"
              >
                {theme === 'dark' ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0-1.414 1.414M7.05 16.95l-1.414 1.414" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3A7 7 0 0021 12.79z" />
                  </svg>
                )}
              </button>
              
              {/* Hamburger Menu Button */}
              <button
                type="button"
                className="p-2 rounded-xl bg-elevated/60 border border-border/40 text-foreground transition-all duration-300"
                onClick={toggleMobileMenu}
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-bg/80 backdrop-blur-sm" onClick={closeMobileMenu}>
          <div className="fixed top-16 left-0 right-0 bg-surface/95 backdrop-blur-lg border-b border-border/50 shadow-xl">
            <div className="px-6 py-6 space-y-6">
              {/* Mobile Navigation */}
              <div className="space-y-3">
                <a
                  href="/dashboard"
                  className="block px-4 py-3 rounded-lg text-base font-medium text-foreground bg-elevated/50 hover:bg-elevated transition-all duration-200"
                  onClick={closeMobileMenu}
                >
                  📊 Dashboard
                </a>
                <a
                  href="/leaderboard"
                  className="block px-4 py-3 rounded-lg text-base font-medium text-foreground bg-elevated/50 hover:bg-elevated transition-all duration-200"
                  onClick={closeMobileMenu}
                >
                  🏆 Leaderboard
                </a>
                <a
                  href="/profile"
                  className="block px-4 py-3 rounded-lg text-base font-medium text-foreground bg-elevated/50 hover:bg-elevated transition-all duration-200"
                  onClick={closeMobileMenu}
                >
                  👤 Profile
                </a>
              </div>
              
              {/* Mobile User Section */}
              {user && (
                <div className="border-t border-border/30 pt-6">
                  <a 
                    href="/profile"
                    className="flex items-center space-x-4 mb-4"
                  >
                    {/* User Profile Picture or Initial */}
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || user.email || 'User'}
                        className="h-12 w-12 rounded-full object-cover border-2 border-border/30"
                        onError={(e) => {
                          // Fallback to initial if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`h-12 w-12 rounded-full bg-gradient-to-br from-medical to-medical-dark flex items-center justify-center text-white text-lg font-semibold ${
                        user.photoURL ? 'hidden' : 'flex'
                      }`}
                    >
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-foreground font-semibold text-lg">{user.displayName || user.username || user.email}</p>
                      <p className="text-muted-foreground text-sm">Medical Student</p>
                    </div>
                  </a>
                  <button
                    onClick={() => {
                      handleLogout();
                      closeMobileMenu();
                    }}
                    className="w-full px-4 py-3 text-left text-base font-medium text-foreground/80 hover:text-foreground bg-elevated/50 hover:bg-elevated rounded-lg transition-all duration-200 border border-border/30 hover:border-border"
                  >
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}