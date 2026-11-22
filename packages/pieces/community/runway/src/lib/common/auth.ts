import { PieceAuth } from '@activepieces/pieces-framework';

export const runwayAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `1. Sign in to the [Runway developer portal](https://dev.runwayml.com).
2. Open **API Keys** and create a key.
3. Copy the key and paste it here.`,
	required: true,
});


