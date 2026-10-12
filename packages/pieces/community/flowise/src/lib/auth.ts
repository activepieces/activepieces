import { HttpError } from '@activepieces/pieces-common';
import { AppConnectionType, PieceAuth, Property, tryCatch } from '@activepieces/pieces-framework';

import { flowiseApi } from './common/api';

export const flowiseAuth = PieceAuth.CustomAuth({
	description: 'Enter your Flowise URL and API Key',
	props: {
		base_url: Property.ShortText({
			displayName: 'Base URL',
			description: 'Enter the base URL',
			required: true,
		}),
		access_token: PieceAuth.SecretText({
			displayName: 'API Key',
			description: 'Enter the API Key',
			required: true,
		}),
	},
	required: true,
	validate: async ({ auth }) => {
		const { data, error } = await tryCatch(() =>
			flowiseApi.listChatflows({ auth: { type: AppConnectionType.CUSTOM_AUTH, props: auth } }),
		);
		if (error instanceof HttpError && error.response.status === 403) {
			return { valid: true };
		}
		return Array.isArray(data)
			? { valid: true }
			: { valid: false, error: 'Invalid Base URL or API Key' };
	},
});
