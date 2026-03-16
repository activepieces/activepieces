import { PieceAuth } from '@activepieces/pieces-framework';

export const openSeaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your OpenSea API key. Get one at https://docs.opensea.io/reference/api-keys',
  required: true,
});
