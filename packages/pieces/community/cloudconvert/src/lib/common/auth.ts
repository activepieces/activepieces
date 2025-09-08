import { PieceAuth } from '@activepieces/pieces-framework';

export const cloudconvertAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: `Secret API key from your CloudConvert dashboard. Get it from: https://cloudconvert.com/dashboard/api/v2/keys`,
    required: true,
});
