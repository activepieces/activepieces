import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { ninjapipeClient } from './common/client';

export const ninjapipeAuth = PieceAuth.CustomAuth({
  displayName: 'NinjaPipe API Connection',
  required: true,
  description: `Connect to your NinjaPipe workspace.

1. Log in to NinjaPipe and open **Workspace Settings > NinjaPipe API**.
2. Create an **API key** (starts with \`np_\`). Pick **write** permission if your flows create, update or delete records.
3. Enter your workspace **API Base URL**. The default is \`https://www.ninjapipe.app/api\`.`,
  props: {
    base_url: Property.ShortText({
      displayName: 'API Base URL',
      description: 'Your workspace API base URL (e.g. https://www.ninjapipe.app/api).',
      required: true,
      defaultValue: 'https://www.ninjapipe.app/api',
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your workspace API key from NinjaPipe Settings > API.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const baseUrl = String(auth.base_url ?? '').trim();
    let parsed: URL;
    try {
      parsed = new URL(baseUrl);
    } catch {
      return { valid: false, error: 'Base URL is not a valid URL.' };
    }
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Base URL must use https://.' };
    }
    if (parsed.username || parsed.password) {
      return { valid: false, error: 'Base URL must not contain a user name or password.' };
    }
    const host = parsed.hostname.toLowerCase();
    if (isBlockedHost(host)) {
      return { valid: false, error: `Base URL host "${host}" is not allowed (loopback, private, or metadata IP).` };
    }
    try {
      await ninjapipeClient.ninjapipeRequest({
        auth: ninjapipeClient.readAuth(auth),
        method: HttpMethod.GET,
        path: '/contacts',
        query: { limit: 1 },
        operation: 'connection check',
      });
      return { valid: true };
    } catch (e) {
      const status = e instanceof Error && 'status' in e ? Number(e.status) : undefined;
      if (status === 401 || status === 403) {
        return { valid: false, error: 'API key was rejected. Check the key in NinjaPipe Settings > API.' };
      }
      if (status === 404) {
        return { valid: false, error: 'Base URL is reachable but /contacts returned 404. Check the Base URL path.' };
      }
      return {
        valid: false,
        error: `Could not connect to NinjaPipe (${status ?? (e instanceof Error ? e.message : 'unknown error')}). Check the Base URL and API Key.`,
      };
    }
  },
});

function isBlockedHost(host: string): boolean {
  return (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host.endsWith('.localhost') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^\[?(fc|fd)[0-9a-f]{2}:/i.test(host) ||
    /^\[?fe80:/i.test(host) ||
    host === '[::1]' ||
    host === '::1'
  );
}
