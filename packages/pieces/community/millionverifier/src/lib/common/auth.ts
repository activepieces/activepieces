import { PieceAuth } from '@activepieces/pieces-framework';

export const millionVerifierAuth = PieceAuth.SecretText({
  displayName: 'MillionVerifier API Key',
  description: 'API Key for MillionVerifier',
  required: true,
});
