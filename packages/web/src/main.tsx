import './polyfills';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';

import './i18n';
import App from './app/app';
import { otom8ClerkAppearance } from './lib/otom8-clerk-appearance';
import { OTOM8_SITE_URL } from './lib/otom8-site-url';
import { IS_PROD } from './lib/deploy-env';

// IS_PROD checks window.location.hostname at runtime — no build-time env var needed.
// On app.otom8.us hostname !== "localhost" so IS_PROD is always true → prod key used.
const CLERK_PUBLISHABLE_KEY = IS_PROD
  ? 'pk_live_Y2xlcmsub3RvbTgudXMk'
  : (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
     'pk_test_c3dlZXBpbmctcGFuZ29saW4tNjQuY2xlcmsuYWNjb3VudHMuZGV2JA');

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <StrictMode>
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={otom8ClerkAppearance}
      signInUrl={`${OTOM8_SITE_URL}/login`}
      signUpUrl={`${OTOM8_SITE_URL}/login`}
      afterSignOutUrl={`${OTOM8_SITE_URL}/login`}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
);
