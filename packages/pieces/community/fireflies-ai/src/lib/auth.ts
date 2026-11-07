import { PieceAuth } from '@activepieces/pieces-framework';

export const firefliesAiAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `To get your API key:
1. Log in to [Fireflies](https://app.fireflies.ai).
2. Open **Settings** > **Developer Settings**.
3. Copy the key under **API Key**.`,
	required: true,
});
