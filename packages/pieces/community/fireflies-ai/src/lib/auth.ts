import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
To use Fireflies.ai, you need to get an API key:
1. Login to your account at https://fireflies.ai.
2. Navigate to Settings > Developer Settings in the left sidebar.
3. Copy the API key from the API Key section.
`;

export const firefliesAiAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: markdownDescription,
	required: true,
});
