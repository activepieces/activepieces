import { AppConnectionType, PieceAuth, tryCatch } from '@activepieces/pieces-framework';

import { senderApi } from './common/api';

export const senderAuth = PieceAuth.SecretText({
	displayName: 'API Token',
	description: `To get your API token:
1. Sign in to [Sender](https://app.sender.net) and open the [API access tokens](https://app.sender.net/settings/tokens) settings.
2. Create a new API token.
3. Copy the token and paste it here. It gives full access to your account, so keep it private.`,
	required: true,
	validate: async ({ auth }) => {
		const { error } = await tryCatch(() =>
			senderApi.listGroups({
				auth: { type: AppConnectionType.SECRET_TEXT, secret_text: auth },
				limit: 1,
			}),
		);
		return error
			? {
					valid: false,
					error: 'Invalid API token. Check that it is copied in full and has not expired.',
			  }
			: { valid: true };
	},
	getConnectionIdentifier: async ({ auth }) => {
		const { data } = await tryCatch(() =>
			senderApi.getMe({ auth: { type: AppConnectionType.SECRET_TEXT, secret_text: auth } }),
		);
		return data?.email ?? data?.username;
	},
});
