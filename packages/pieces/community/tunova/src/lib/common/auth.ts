import { PieceAuth } from '@activepieces/pieces-framework';

export const tunovaAuth = PieceAuth.CustomAuth({
  description:
    'Your Tunova API key (sk_live_…). Get one free — 50 tokens, no card — at https://tunova.ai',
  props: {
    // SecretText → the key is masked in the UI and never displayed as a plain text prop.
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Tunova API key (sk_live_…).',
      required: true,
    }),
  },
  required: true,
});
