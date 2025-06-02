// src/lib/common.ts
import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const crispAuth = PieceAuth.CustomAuth({
  description: 'Authenticate with your Crisp API token',
  required: true,
  props: {
    token: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Crisp API Key (found in your Crisp dashboard under Settings > API)',
      required: true
    }),
    identifier: Property.ShortText({
      displayName: 'API Identifier',
      description: 'Your Crisp API identifier (found alongside your Key)',
      required: true
    })
  }
});