import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { getWebsiteStats } from './lib/actions/get-website-stats';
import { getWebsiteMetrics } from './lib/actions/get-website-metrics';
import { getActiveVisitors } from './lib/actions/get-active-visitors';
import { getPageviews } from './lib/actions/get-pageviews';
import { sendEvent } from './lib/actions/send-event';
import { listWebsites } from './lib/actions/list-websites';
import { newEvent } from './lib/triggers/new-event';
import { newSession } from './lib/triggers/new-session';

export const umamiAuth = PieceAuth.CustomAuth({
  displayName: 'Umami Connection',
  description: `To connect your Umami account:
1. Log in to your Umami dashboard
2. Go to **Settings > API Keys**
3. Click **Create API Key**
4. Copy the key and paste it below

For **Server URL**, enter your Umami instance URL (e.g. \`https://cloud.umami.is\` or your self-hosted URL).`,
  required: true,
  props: {
    base_url: Property.ShortText({
      displayName: 'Server URL',
      description: 'Your Umami server URL (e.g. https://cloud.umami.is or your self-hosted URL). Do not include a trailing slash.',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Umami API key.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const { httpClient, HttpMethod } = await import('@activepieces/pieces-common');
      const baseUrl = auth.base_url.replace(/\/+$/, '');
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/api/me`,
        headers: {
          'x-umami-api-key': auth.api_key,
        },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid connection. Check your server URL and API key.' };
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
  authors: [],
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
      authMapping: async (auth) => ({
        'x-umami-api-key': (auth as unknown as { props: { api_key: string } }).props.api_key,
      }),
    }),
  ],
  triggers: [newEvent, newSession],
});
