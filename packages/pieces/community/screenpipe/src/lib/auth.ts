import { PieceAuth, Property } from '@activepieces/pieces-framework';

export type ScreenpipeAuth = {
  baseUrl: string;
};

export const screenpipeAuth = PieceAuth.CustomAuth({
  displayName: 'Screenpipe Connection',
  description:
    'Connect to your Screenpipe instance. Screenpipe must be running locally or accessible at the specified URL.',
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description:
        'The URL of your Screenpipe instance (default: http://localhost:3030)',
      required: true,
      defaultValue: 'http://localhost:3030',
    }),
  },
  validate: async ({ auth }) => {
    try {
      const url = auth.baseUrl.replace(/\/$/, '');
      const response = await fetch(`${url}/health`);
      if (!response.ok) {
        return {
          valid: false,
          error: 'Screenpipe instance returned an error.',
        };
      }
      const data = await response.json();
      if (data.status === 'healthy' || data.status === 'degraded') {
        return { valid: true };
      }
      return {
        valid: false,
        error: `Screenpipe status: ${data.status}`,
      };
    } catch {
      return {
        valid: false,
        error:
          'Could not connect to Screenpipe. Make sure it is running.',
      };
    }
  },
});
