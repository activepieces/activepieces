import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const ninjapipeAuth = PieceAuth.CustomAuth({
  displayName: 'NinjaPipe API',
  description: 'Connect to NinjaPipe with your API key. To get your API key: 1) Log in to your NinjaPipe workspace, 2) Go to Settings > API, 3) Click "Generate API Key" and copy it.',
  required: true,
  props: {
    base_url: Property.ShortText({
      displayName: 'Base URL',
      description: 'Your NinjaPipe API base URL (usually https://www.ninjapipe.app/api)',
      required: true,
      defaultValue: 'https://www.ninjapipe.app/api',
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your NinjaPipe workspace API key from Settings > API',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const response = await fetch(
        `${auth.base_url.replace(/\/+$/, '')}/contacts?page=1&limit=1`,
        { headers: { Authorization: `Bearer ${auth.api_key}`, Accept: 'application/json' } },
      );
      if (response.ok) return { valid: true };
      return { valid: false, error: `HTTP ${response.status}: ${response.statusText}` };
    } catch (e: unknown) {
      return { valid: false, error: `Connection failed: ${(e as Error).message}` };
    }
  },
});

export type NinjaPipeAuth = { base_url: string; api_key: string };
