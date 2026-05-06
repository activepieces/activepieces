import { PieceAuth } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/shared';

import { tallyApiClient } from './common/client';

export const tallyAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description:
		`You can obtain API key from [Settings page](https://tally.so/settings/api-keys)`,
	required: true,
	validate: async ({ auth }) => {
		const { error } = await tryCatch(() => tallyApiClient.validateApiKey(auth));
		return error ? { valid: false, error: 'Invalid API key.' } : { valid: true };
	},
});
