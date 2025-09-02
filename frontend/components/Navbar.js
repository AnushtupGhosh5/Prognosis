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
      <nav className="sticky top-0 z-50 bg-surface/95 backdrop-blur-lg border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center">
                  <img 
                    src="/favicon.ico"
                    alt="Prognosis Logo"
                    className="h-8 w-8 object-contain"
                    onError={(e) => {
                      // Fallback to SVG icon if favicon fails to load
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'block';
                    }}
                  />
                  <svg 
                    className="h-6 w-6 text-medical" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ display: 'none' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                  </svg>
                </div>
                <span className="ml-3 text-xl font-bold text-foreground tracking-tight">Prognosis</span>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:ml-8 md:flex md:space-x-1">
                <a
                  href="/dashboard"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-elevated transition-all duration-200 relative group"
                >
                  <span className="relative z-10">Dashboard</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-medical/10 to-medical-dark/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </a>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="p-2.5 rounded-lg border border-border/60 hover:border-border hover:bg-elevated text-foreground transition-all duration-200 group"
              >
                {theme === 'dark' ? (
                  <svg className="h-5 w-5 transform group-hover:rotate-12 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0-1.414 1.414M7.05 16.95l-1.414 1.414" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 transform group-hover:-rotate-12 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3A7 7 0 0021 12.79z" />
                  </svg>
                )}
              </button>
              
              {/* User Info and Logout */}
              {user && (
                <div className="flex items-center space-x-3">
                  {/* User Profile Picture or Initial */}
                  <div className="flex items-center space-x-3">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || user.email || 'User'}
                        className="h-8 w-8 rounded-full object-cover border-2 border-border/30 hover:border-border transition-colors duration-200"
                        onError={(e) => {
                          // Fallback to initial if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`h-8 w-8 rounded-full bg-gradient-to-br from-medical to-medical-dark flex items-center justify-center text-white text-sm font-semibold ${
                        user.photoURL ? 'hidden' : 'flex'
                      }`}
                    >
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Welcome, </span>
                      <span className="text-foreground font-semibold">{user.displayName || user.username || user.email}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground bg-elevated/60 hover:bg-elevated border border-border/40 hover:border-border rounded-lg transition-all duration-200 hover:shadow-md"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="p-2 rounded-lg border border-border/60 hover:bg-elevated text-foreground transition-all duration-200"
              >
                {theme === 'dark' ? (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0-1.414 1.414M7.05 16.95l-1.414 1.414" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3A7 7 0 0021 12.79z" />
                  </svg>
                )}
              </button>
              
              {/* Hamburger Menu Button */}
              <button
                type="button"
                className="p-2 rounded-lg text-foreground hover:bg-elevated transition-all duration-200 border border-border/60 hover:border-border"
                onClick={toggleMobileMenu}
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
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
                  Dashboard
                </a>
              </div>
              
              {/* Mobile User Section */}
              {user && (
                <div className="border-t border-border/30 pt-6">
                  <div className="flex items-center space-x-4 mb-4">
                    {/* User Profile Picture or Initial */}
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || user.email || 'User'}
                        className="h-12 w-12 rounded-xl object-cover border-2 border-border/30"
                        onError={(e) => {
                          // Fallback to initial if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`h-12 w-12 rounded-xl bg-gradient-to-br from-medical to-medical-dark flex items-center justify-center text-white text-lg font-semibold ${
                        user.photoURL ? 'hidden' : 'flex'
                      }`}
                    >
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-foreground font-semibold text-lg">{user.displayName || user.username || user.email}</p>
                      <p className="text-muted-foreground text-sm">Medical Student</p>
                    </div>
                  </div>
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