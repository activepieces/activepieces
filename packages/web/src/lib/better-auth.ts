import { twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { API_URL } from './api';

export const authClient = createAuthClient({
  baseURL: `${API_URL}/v1/better-auth`,
  plugins: [twoFactorClient()],
});
