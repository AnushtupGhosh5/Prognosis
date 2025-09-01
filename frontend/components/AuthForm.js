'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { loginWithCustomToken, signInWithGoogle, signInWithGithub } from '../lib/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function AuthForm({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState({ google: false, github: false });
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSocialAuth = async (provider) => {
    setSocialLoading(prev => ({ ...prev, [provider]: true }));
    setError('');

    try {
      let user;
      if (provider === 'google') {
        user = await signInWithGoogle();
      } else if (provider === 'github') {
        user = await signInWithGithub();
      }

      // Get Firebase ID token
      const idToken = await user.getIdToken();
      
      // Call backend social auth endpoint
      const response = await axios.post(`${API_BASE_URL}/api/auth/social`, {}, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      const { user_id, email, name } = response.data;
      
      // Store user info
      const userInfo = {
        user_id,
        email,
        displayName: name || user.displayName,
        photoURL: user.photoURL
      };

      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      if (onAuthSuccess) {
        onAuthSuccess(userInfo);
      }
      
    } catch (err) {
      console.error(`${provider} auth error:`, err);
      setError(err.response?.data?.error || err.message || `Failed to sign in with ${provider}`);
    } finally {
      setSocialLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
        email: formData.email,
        password: formData.password
      });
      
      const { token, user_id, email } = response.data;
      
      // Sign in with custom token
      await loginWithCustomToken(token);
      
      // Store user info in localStorage
      localStorage.setItem('userInfo', JSON.stringify({
        user_id,
        email
      }));
      
      if (onAuthSuccess) {
        onAuthSuccess({ user_id, email });
      }
      
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg via-bg to-surface/30 flex items-center justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 flex items-center justify-center rounded-2xl sm:rounded-3xl bg-white/10 backdrop-blur-sm text-white shadow-lg sm:shadow-2xl mb-4 sm:mb-6 lg:mb-8 border border-white/20">
            <img 
              src="/favicon.ico"
              alt="Prognosis Logo"
              className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
            <svg 
              className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ display: 'none' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-2 sm:mb-3">Prognosis</h1>
          <h2 className="text-base sm:text-lg lg:text-xl font-medium text-muted-foreground mb-6 sm:mb-8">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
        </div>

        {/* Auth Form Card */}
        <div className="bg-surface/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-6 sm:p-8 border border-border/30 relative overflow-hidden">
          
          <div className="relative z-10">
            {/* Social Auth Buttons - Mobile responsive */}
            <div className="space-y-3 mb-6 sm:mb-8">
              <button
                type="button"
                onClick={() => handleSocialAuth('google')}
                disabled={socialLoading.google}
                className="w-full flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 bg-white hover:bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-200 text-gray-700 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md text-sm sm:text-base"
              >
                {socialLoading.google ? (
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 718-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span className="truncate">Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialAuth('github')}
                disabled={socialLoading.github}
                className="w-full flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 bg-gray-900 hover:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-700 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md text-sm sm:text-base"
              >
                {socialLoading.github ? (
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 718-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                )}
                <span className="truncate">Continue with GitHub</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-3 sm:px-4 bg-surface/80 text-muted-foreground font-medium">or continue with email</span>
              </div>
            </div>

            {/* Email Form - Mobile responsive */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-elevated/50 rounded-xl sm:rounded-2xl border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-medical/30 focus:border-medical transition-all duration-200 backdrop-blur-sm text-sm sm:text-base"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              
              {!isLogin && (
                <div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-elevated/50 rounded-xl sm:rounded-2xl border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-medical/30 focus:border-medical transition-all duration-200 backdrop-blur-sm text-sm sm:text-base"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-medical to-medical/90 text-white font-semibold rounded-xl sm:rounded-2xl hover:from-medical/90 hover:to-medical focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-medical transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 718-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {/* Toggle Link */}
            <div className="text-center mt-6 sm:mt-8">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {isLogin ? (
                  <>Don't have an account? <span className="text-medical font-medium hover:underline">Sign up</span></>
                ) : (
                  <>Already have an account? <span className="text-medical font-medium hover:underline">Sign in</span></>
                )}
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-error/10 border border-error/20 rounded-xl sm:rounded-2xl backdrop-blur-sm">
                <div className="flex items-start">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-error mt-0.5 mr-2 sm:mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs sm:text-sm text-error font-medium">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}