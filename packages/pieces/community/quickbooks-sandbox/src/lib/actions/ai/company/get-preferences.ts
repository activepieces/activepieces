import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksClient } from '../../../common/client';
import { quickbooksSandboxGetPreferencesOutputSchema } from '../../../output-schemas';

export const getPreferencesAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_preferences',
	outputSchema: quickbooksSandboxGetPreferencesOutputSchema,
	displayName: 'Get Preferences',
	description: 'Gets the connected company\'s preferences.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads the connected company\'s settings: accounting (class and location tracking), sales forms, products and services, vendors and purchases, time tracking, tax, currency and email messages. Use it to check whether a feature is on before calling actions that need it. Takes no input.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await quickbooksClient.request<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: '/preferences',
		});
	},
});
