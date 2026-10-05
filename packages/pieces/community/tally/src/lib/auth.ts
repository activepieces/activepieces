import { PieceAuth } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/pieces-framework';

import { tallyApiClient } from './common/client';

export const tallyAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `To get your API key:

1. Sign in to [Tally](https://tally.so) and open **Settings**.
2. Go to **API keys** and click **Create API key**.
3. Copy the key and paste it below.`,
	required: true,
	validate: async ({ auth }) => {
		const { error } = await tryCatch(() => tallyApiClient.validateApiKey(auth));
		return error ? { valid: false, error: 'Invalid API key.' } : { valid: true };
	},
});
