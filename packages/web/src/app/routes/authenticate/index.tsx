import { useAuth } from '@clerk/clerk-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';
import { OTOM8_SITE_URL } from '@/lib/otom8-site-url';

// Matches otom8-site signout aesthetic (see
// otom8-site/site/src/app/signout/page.tsx) so the SSO hop from marketing
// site -> AP is visually continuous. Dark bg, accent pulse, wordmark, tagline.
const AuthenticatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const response = searchParams.get('response');

  // If the URL already carries a response param (server-to-server path through
  // 3001/api/ap-sso), save the token synchronously before any async effect can
  // run and navigate away.
  const [saved] = useState(() => {
    if (!response) return false;
    try {
      authenticationSession.saveResponse(JSON.parse(response), false);
      return true;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (saved) {
      navigate('/flows');
      return;
    }

    // No response param — Clerk landed us here directly (forceRedirectUrl="/authenticate").
    // Get a fresh Clerk token and call Fastify's ap-sso endpoint via the Vite proxy
    // (/api → :3000). This keeps the entire flow on the same origin and avoids the
    // cross-origin 4200→3001→4200 hop that caused Clerk to re-initialize and loop.
    async function exchangeToken() {
      const token = await getToken();
      if (!token) {
        authenticationSession.clearSession();
        window.location.href = OTOM8_SITE_URL
          ? `${OTOM8_SITE_URL}/login`
          : '/login';
        return;
      }

      try {
        // Vite proxy forwards /api/* → localhost:3000/api/*.
        // Fastify /api/ap-sso verifies the Clerk bearer token, signs an AP JWT,
        // and redirects to /authenticate?response=<encoded-auth-json>.
        // fetch(redirect:'follow') follows the redirect; resp.url is the final URL.
        const resp = await fetch('/api/ap-sso', {
          headers: { Authorization: `Bearer ${token}` },
          redirect: 'follow',
        });

        const finalUrl = new URL(resp.url);
        const responseParam = finalUrl.searchParams.get('response');

        if (responseParam) {
          authenticationSession.saveResponse(JSON.parse(responseParam), false);
          navigate('/flows');
        } else {
          authenticationSession.clearSession();
          window.location.href = OTOM8_SITE_URL
            ? `${OTOM8_SITE_URL}/login`
            : '/login';
        }
      } catch {
        authenticationSession.clearSession();
        window.location.href = OTOM8_SITE_URL
          ? `${OTOM8_SITE_URL}/login`
          : '/login';
      }
    }

    exchangeToken();
  }, [getToken, navigate, saved]);

  return (
    <main
      className="relative min-h-[100dvh] flex items-center justify-center px-6 overflow-hidden"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div
          className="rounded-full blur-[120px] animate-pulse"
          style={{
            width: 400,
            height: 400,
            backgroundColor: 'rgba(16, 185, 129, 0.10)',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center gap-6 text-center"
      >
        <div
          className="text-3xl tracking-tight"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 500,
            color: '#F5F5F5',
            letterSpacing: '-0.01em',
          }}
        >
          ot<span style={{ color: '#10B981' }}>∞</span>m8
        </div>

        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full rounded-full animate-ping"
              style={{ backgroundColor: '#10B981', opacity: 0.6 }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: '#10B981' }}
            />
          </span>
          <p className="text-sm tracking-wide" style={{ color: '#A1A1AA' }}>
            Connecting your workspace…
          </p>
        </div>
      </motion.div>
    </main>
  );
};

export default AuthenticatePage;
