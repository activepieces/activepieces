import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { getWebsiteStats } from './lib/actions/get-website-stats';
import { getWebsiteMetrics } from './lib/actions/get-website-metrics';
import { getActiveVisitors } from './lib/actions/get-active-visitors';
import { getPageviews } from './lib/actions/get-pageviews';
import { sendEvent } from './lib/actions/send-event';
import { listWebsites } from './lib/actions/list-websites';
import { newReferrerDetected } from './lib/triggers/new-referrer-detected';
import { resolveAuthHeaders } from './lib/common';

export const umamiAuth = PieceAuth.CustomAuth({
  displayName: 'Umami Connection',
  description: `To connect your Umami instance:

**Self-hosted**: Enter your server URL, username and password (the same credentials you use to log in to your Umami dashboard).

**Umami Cloud**: Enter your server URL (\`https://cloud.umami.is\`) and your API key (found in **Settings > API Keys**).`,
  required: true,
  props: {
    base_url: Property.ShortText({
      displayName: 'Server URL',
      description: 'Your Umami server URL (e.g. https://cloud.umami.is or your self-hosted URL). Do not include a trailing slash.',
      required: true,
    }),
    auth_mode: Property.StaticDropdown({
      displayName: 'Authentication Mode',
      description: 'Choose how to authenticate with your Umami instance.',
      required: true,
      defaultValue: 'self_hosted',
      options: {
        options: [
          { label: 'Self-hosted (Username & Password)', value: 'self_hosted' },
          { label: 'Umami Cloud (API Key)', value: 'cloud' },
        ],
      },
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Your Umami username (for self-hosted instances).',
      required: false,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Your Umami password (for self-hosted instances).',
      required: false,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Umami Cloud API key.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const { httpClient, HttpMethod } = await import('@activepieces/pieces-common');
      const baseUrl = auth.base_url.replace(/\/+$/, '');
      const headers = await resolveAuthHeaders(auth);
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/api/me`,
        headers,
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid connection. Check your server URL and credentials.' };
    }
  },
});

export const umami = createPiece({
  displayName: 'Umami',
  description: 'Privacy-focused, open-source web analytics.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/umami.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: umamiAuth,
  authors: ['bst1n'],
  actions: [
    getWebsiteStats,
    getWebsiteMetrics,
    getActiveVisitors,
    getPageviews,
    sendEvent,
    listWebsites,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        const props = (auth as unknown as { props: { base_url: string } }).props;
        return props.base_url.replace(/\/+$/, '') + '/api';
      },
      auth: umamiAuth,
      authMapping: async (auth) => {
        const { resolveAuthHeaders: resolve } = await import('./lib/common');
        const props = (auth as unknown as { props: UmamiAuthProps }).props;
        return resolve(props);
      },
    }),
  ],
  triggers: [newReferrerDetected],
});

type UmamiAuthProps = {
  base_url: string;
  auth_mode: string;
  username?: string;
  password?: string;
  api_key?: string;
};
