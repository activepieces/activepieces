import { PieceAuth } from '@activepieces/pieces-framework';

export const runwayAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Runway API key (Bearer).',
  required: true,
});

