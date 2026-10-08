import { AppConnectionType, PieceAuth, Property, tryCatch } from '@activepieces/pieces-framework';

import { mauticApi } from './common/api';

const markdownDescription = `
Follow these steps:

1. **Enter the Base URL:** Open your Mautic instance and copy the URL from the address bar. If your dashboard link is "https://mautic.ddev.site/s/dashboard", set your base URL as "https://mautic.ddev.site/".

2. **Enable Basic Authentication:** Log in to Mautic, go to **Settings** > **Configuration** > **API Settings**, and ensure that Basic Authentication is enabled.

`;

export const mauticAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  props: {
    base_url: Property.ShortText({
      displayName: 'Base URL',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() =>
      mauticApi.getCurrentUser({ auth: { type: AppConnectionType.CUSTOM_AUTH, props: auth } }),
    );
    if (error) {
      return {
        valid: false,
        error: 'Could not sign in to Mautic. Check the base URL, username and password, and that Basic Authentication is enabled in API Settings.',
      };
    }
    return { valid: true };
  },
  required: true,
});
