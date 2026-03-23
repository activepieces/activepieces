import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const bubbleAuth = PieceAuth.CustomAuth({
  description: `Enter Bubble Connection Details
  In the bubble editor click Settings > API 
  1. Your app name is https://appname.bubbleapps.io
  2. Enter/Generate an API key
  `,
  props: {
    appname: Property.ShortText({
      displayName: 'App name',
      description: 'Enter the app name',
      required: true,
    }),
    token: PieceAuth.SecretText({
      displayName: 'API Token',
      description: 'Enter the access token',
      required: true,
    }),
  },
  // Optional Validation
  validate: async ({ auth }) => {
    if (auth) {
      return {
        valid: true,
      };
    }
    return {
      valid: false,
      error: 'Please enter a valid app name and token',
    };
  },
  required: true,
});
