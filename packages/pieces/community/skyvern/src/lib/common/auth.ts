import { PieceAuth } from "@activepieces/pieces-framework";

export const skyvernAuth = PieceAuth.CustomAuth({
  description:
    'Enter your Skyvern API key. You can find it in your Skyvern account settings.',
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
});
