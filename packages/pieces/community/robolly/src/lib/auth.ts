import { AppConnectionType, PieceAuth, tryCatch } from '@activepieces/pieces-framework';

import { robollyApi } from './common/api';

const markdownDescription = `
To get your API key:
1. Log in to [Robolly](https://robolly.com/dashboard/).
2. Open your project and go to **API**.
3. Copy the API key and paste it here.
`;

export const robollyAuth = PieceAuth.SecretText({
	description: markdownDescription,
	displayName: 'API Key',
	required: true,
	validate: async ({ auth }) => {
		const { error } = await tryCatch(() =>
			robollyApi.listTemplates({
				auth: { type: AppConnectionType.SECRET_TEXT, secret_text: auth },
			}),
		);
		if (error) {
			return {
				valid: false,
				error: 'Invalid API key. Copy it again from your Robolly project → API.',
			};
		}
		return { valid: true };
	},
});
