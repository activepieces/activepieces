import { PieceAuth } from '@activepieces/pieces-framework';

export const emailoctopusAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: `
    To obtain your API key:
    1. Go to EmailOctopus (https://emailoctopus.com)
    2. Log in or create an account
    3. Go to your account settings
    4. Navigate to the API Keys section
    5. Create a new API key (or use an existing one)
    6. Copy the API key and paste it here
    `,
    required: true,
});
