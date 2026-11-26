import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { GotifyApiError, gotifyClient } from './common/client';

export const gotifyAuth = PieceAuth.CustomAuth({
  description: `Connect your self-hosted Gotify server.

1. Log in to your Gotify web UI.
2. Open **Apps**, create an application (or pick one) and copy its token into **App Token**. Notifications are sent with it.
3. Optional: open **Clients**, create a client as the same user that owns the app, and copy its token into **Client Token**. Every action except sending a notification and checking server health needs it.`,
  props: {
    base_url: Property.ShortText({
      displayName: 'Server URL',
      description: 'Include the sub-path if Gotify is served under one.',
      placeholder: 'https://gotify.example.com',
      required: true,
    }),
    app_token: PieceAuth.SecretText({
      displayName: 'App Token',
      description: 'Token of a Gotify application. Used to send notifications.',
      required: true,
    }),
    client_token: PieceAuth.SecretText({
      displayName: 'Client Token',
      description: 'Needed by every action except sending and server health.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    try {
      gotifyClient.normalizeBaseUrl(auth.base_url);
      gotifyClient.appTokenOf(auth);
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Invalid connection.' };
    }
    try {
      const health = await gotifyClient.request({ auth, method: HttpMethod.GET, path: '/health', tokenKind: 'none' });
      if (!gotifyClient.isRecord(health) || typeof health['health'] !== 'string') {
        return { valid: false, error: 'The Server URL does not point to a Gotify server.' };
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? `Could not reach the Gotify server: ${error.message}` : 'Could not reach the Gotify server.',
      };
    }
    if (!auth.client_token || auth.client_token.trim() === '') {
      return { valid: true };
    }
    try {
      const apps = await gotifyClient.request({ auth, method: HttpMethod.GET, path: '/application', tokenKind: 'client' });
      const appToken = gotifyClient.appTokenOf(auth);
      const known = gotifyClient.arrayOf(apps).some((app) => gotifyClient.isRecord(app) && app['token'] === appToken);
      if (!known) {
        return { valid: false, error: 'The App Token does not belong to the user of this Client Token.' };
      }
      return { valid: true };
    } catch (error) {
      if (error instanceof GotifyApiError && (error.status === 401 || error.status === 403)) {
        return { valid: false, error: 'Invalid Client Token.' };
      }
      return {
        valid: false,
        error: error instanceof Error ? `Could not check the Client Token: ${error.message}` : 'Could not check the Client Token.',
      };
    }
  },
  required: true,
});
