import './polyfills';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';

import './i18n';
import App from './app/app';
import { otom8ClerkAppearance } from './lib/otom8-clerk-appearance';
import { OTOM8_SITE_URL } from './lib/otom8-site-url';

// Clerk publishable key is baked at Vite build time (VITE_CLERK_PUBLISHABLE_KEY).
// Dev fallback uses the shared otom8 Development instance so `bun run serve`
// works without touching env. Prod images pass pk_live_* via Docker build arg.
const CLERK_PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  'pk_test_c3dlZXBpbmctcGFuZ29saW4tNjQuY2xlcmsuYWNjb3VudHMuZGV2JA';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <StrictMode>
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={otom8ClerkAppearance}
      isSatellite
      domain={new URL(OTOM8_SITE_URL).hostname}
      signInUrl={`${OTOM8_SITE_URL}/login`}
      signUpUrl={`${OTOM8_SITE_URL}/login`}
      afterSignOutUrl={`${OTOM8_SITE_URL}/auth/signout`}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
);
