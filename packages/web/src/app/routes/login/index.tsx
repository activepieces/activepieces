import { SignIn, useAuth } from '@clerk/clerk-react';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';
import { otom8ClerkAppearance } from '@/lib/otom8-clerk-appearance';
import { OTOM8_SITE_URL } from '@/lib/otom8-site-url';

export function LoginPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    if (isSignedIn && authenticationSession.isLoggedIn()) {
      navigate('/flows', { replace: true });
      return;
    }
    if (!isSignedIn) {
      authenticationSession.clearSession();
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <main
      className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12 overflow-hidden"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      {/* Green glow */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="rounded-full animate-pulse"
          style={{
            width: 520,
            height: 520,
            backgroundColor: 'rgba(16,185,129,0.08)',
            filter: 'blur(120px)',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[420px] flex flex-col items-center gap-8"
      >
        <Link to="/" className="group flex flex-col items-center gap-3">
          <span
            className="font-display text-3xl font-semibold tracking-tight"
            style={{ color: '#F5F5F5' }}
          >
            ot<span style={{ color: '#10B981' }}>∞</span>m8
          </span>
          <span
            className="text-xs font-medium tracking-[0.2em] uppercase transition-colors"
            style={{ color: '#A1A1AA' }}
          >
            Welcome back
          </span>
        </Link>

        <div
          className="w-full rounded-2xl p-1"
          style={{
            border: '1px solid rgba(255,255,255,0.10)',
            backgroundColor: 'rgba(17,17,17,0.60)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 0 40px rgba(16,185,129,0.08)',
          }}
        >
          <SignIn
            routing="virtual"
            forceRedirectUrl={`${OTOM8_SITE_URL}/api/ap-sso`}
            signUpForceRedirectUrl={`${OTOM8_SITE_URL}/api/ap-sso`}
            appearance={{
              ...otom8ClerkAppearance,
              variables: {
                ...otom8ClerkAppearance.variables,
                colorBackground: 'transparent',
              },
              elements: {
                ...otom8ClerkAppearance.elements,
                rootBox: { width: '100%' },
                card: {
                  boxShadow: 'none',
                  border: 'none',
                  backgroundColor: 'transparent',
                  padding: '1.75rem 1.5rem 1.5rem',
                },
                header: { display: 'none' },
              },
            }}
          />
        </div>
      </motion.div>
    </main>
  );
}
