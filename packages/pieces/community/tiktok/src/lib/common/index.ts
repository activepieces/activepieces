import { PieceAuth } from '@activepieces/pieces-framework';

export const tiktokAuth = PieceAuth.SecretText({
    displayName: 'API KEY',
    required: true,
    description: 'The API key for accessing the Tiktok API',
});

export const baseUrl = 'https://open.tiktokapis.com/v2';