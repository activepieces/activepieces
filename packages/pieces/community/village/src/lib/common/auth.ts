import { PieceAuth } from '@activepieces/pieces-framework';

export const VILLAGE_API_BASE_URL = 'https://api.village.ai';

export const villageAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description:
    'Your Village API token. Generate one from your Village settings and paste it here.',
  required: true,
});
