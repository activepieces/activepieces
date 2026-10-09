import { createAction, Property } from '@activepieces/pieces-framework';

import { imageRouterAuth } from '../../auth';
import { imageRouterApi } from '../../common/api';
import { imageRouterGetCreditsOutputSchema } from '../../output-schemas';

export const getCreditsAction = createAction({
	auth: imageRouterAuth,
	name: 'image_router_get_credits',
	outputSchema: imageRouterGetCreditsOutputSchema,
	displayName: 'Get Credits',
	description: 'Gets the account credit balance and usage.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the ImageRouter account balance in USD: remaining credits, total usage and total deposits, and optionally a per-API-key breakdown (usage, request count, spend limit and current-period spend). Use it before paid generations to check there are enough credits. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		includeKeyUsage: Property.Checkbox({
			displayName: 'Include Usage per API Key',
			description: 'Also return usage for each API key on the account. Defaults to off.',
			required: false,
			defaultValue: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await imageRouterApi.getCredits({ auth, byApiKey: propsValue.includeKeyUsage === true });
	},
});
