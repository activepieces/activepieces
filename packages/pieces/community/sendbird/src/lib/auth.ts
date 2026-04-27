import { PieceAuth } from '@activepieces/pieces-framework';

export const sendbirdAuth = PieceAuth.CustomAuth({
  description: 'Authenticate with your Sendbird application.',
  required: true,
  props: {
    appId: PieceAuth.SecretText({
      displayName: 'Application ID',
      description: 'Your Sendbird Application ID (found in Sendbird Dashboard)',
      required: true,
    }),
    apiToken: PieceAuth.SecretText({
      displayName: 'API Token',
      description: 'Your Sendbird API Token (found in Sendbird Dashboard > Settings > General)',
      required: true,
    }),
  },
});

export type SendbirdAuthValue = {
  appId: string;
  apiToken: string;
};
