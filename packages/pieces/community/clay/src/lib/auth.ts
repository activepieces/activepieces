import { PieceAuth } from '@activepieces/pieces-framework';

export const clayAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description:
        'In Clay, go to Settings > Account > API Keys and create a key, then paste it here.',
    required: true,
});
