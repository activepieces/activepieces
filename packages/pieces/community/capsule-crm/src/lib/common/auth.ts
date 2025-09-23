import { PieceAuth } from '@activepieces/pieces-framework';

export const capsuleAuth = PieceAuth.SecretText({
    displayName: 'Personal Access Token',
    description: `
    To obtain your Personal Access Token:

    1. Go to your Capsule CRM account settings at https://capsulecrm.com/user/myAccount
    2. Navigate to the "API & Webhooks" section
    3. Click on "Personal Access Tokens" to create a new token
    4. Give your token a descriptive name (e.g., "ActivePieces Integration")
    5. Copy the generated token and paste it here

    The token will have full API access to your Capsule CRM account.
    `,
    required: true,
});
