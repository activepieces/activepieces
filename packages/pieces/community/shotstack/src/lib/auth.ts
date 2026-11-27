import { PieceAuth, Property, tryCatch } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { shotstackApi } from './common';

export const shotstackAuth = PieceAuth.CustomAuth({
  displayName: 'Connection',
  description: `1. Sign in to [Shotstack](https://app.shotstack.io) (sign-up is free).
2. Open [API Keys](https://app.shotstack.io/keys) in the dashboard.
3. Copy your **Production** key and paste it below.

Production renders use credits and have no watermark. Each environment has its own key.`,
  required: true,
  props: {
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'Pick the environment that matches your key.',
      required: true,
      defaultValue: 'v1',
      options: {
        disabled: false,
        options: [
          { label: 'Production', value: 'v1' },
          { label: 'Sandbox (free, watermarked test renders)', value: 'stage' },
        ],
      },
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'From [API Keys](https://app.shotstack.io/keys) in the Shotstack dashboard: the key for the environment picked above.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() =>
      shotstackApi.request({ connection: auth, method: HttpMethod.GET, path: '/templates' }),
    );
    return error ? { valid: false, error: error.message } : { valid: true };
  },
});
