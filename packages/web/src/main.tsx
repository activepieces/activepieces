import './polyfills';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';

import './i18n';
import App from './app/app';
import { otom8ClerkAppearance } from './lib/otom8-clerk-appearance';
import { OTOM8_SITE_URL } from './lib/otom8-site-url';

// VITE_DEPLOY_ENV=prod is reliably baked into the bundle by the CI workflow.
// Use it to select the correct Clerk instance. The prod key is public (pk_live_*
// is never secret) so hardcoding it here is safe and avoids fragile ARG→ENV→Vite
// secret-passing chains that silently fall through.
const CLERK_PUBLISHABLE_KEY =
  import.meta.env.VITE_DEPLOY_ENV === 'prod'
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
      signInUrl="/login"
      signUpUrl="/login"
      afterSignOutUrl="/login"
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
);
