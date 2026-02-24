import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const letsCalendarAuth = PieceAuth.CustomAuth({
  displayName: 'API Key',
  description: "Authenticate with your Let's Calendar API Key",
  props: {
    client_key: Property.ShortText({
      displayName: 'Client Key',
      description: "Your Let's Calendar Client Key",
      required: true,
    }),
    secret_key: Property.ShortText({
      displayName: 'Client Secret',
      description: "Your Let's Calendar Client Secret",
      required: true,
    }),
  },
  required: true,
});
