import { motion } from 'motion/react';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';

// Matches otom8-site signout aesthetic (see
// otom8-site/site/src/app/signout/page.tsx) so the SSO hop from marketing
// site -> AP is visually continuous. Dark bg, accent pulse, wordmark, tagline.
const AuthenticatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const response = searchParams.get('response');

  useEffect(() => {
    if (response) {
      const decodedResponse = JSON.parse(response);
      authenticationSession.saveResponse(decodedResponse, false);
      navigate('/flows');
    }
  }, [navigate, response]);

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
