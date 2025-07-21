import { createPiece } from '@activepieces/pieces-framework';
import { getFormResponses } from './lib/actions/get-form-responses';
import { getSingleResponse } from './lib/actions/get-single-response';
import { findFormByTitle } from './lib/actions/find-form-by-title';
import { newFormResponse } from './lib/triggers/new-form-response';
import { createCustomApiCallAction, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { makeRequest } from './lib/common';

export const filloutFormsAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	required: true,
	description: `To get your API key:
1. Go to your Fillout account settings.
2. Click on "Developer settings".
3. Generate and copy your API key.
4. Paste it here.`,
	validate: async ({ auth }) => {
		try {
			await makeRequest(auth as string, HttpMethod.GET, '/forms', undefined);
			return { valid: true };
		} catch (error: any) {
			return {
				valid: false,
				error: error.message || 'Invalid API Key. Please check your API key and try again.',
			};
		}
	},
});

export const filloutForms = createPiece({
	displayName: 'Fillout Forms',
	description: 'Create interactive forms and automate workflows with Fillout',
	auth: filloutFormsAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/fillout-forms.png',
	categories: [PieceCategory.FORMS_AND_SURVEYS],
	authors: ['Sanket6652', 'onyedikachi-david'],
	actions: [
		getFormResponses,
		getSingleResponse,
		findFormByTitle,
		createCustomApiCallAction({
			auth: filloutFormsAuth,
			baseUrl: () => 'https://api.fillout.com/v1/api',
			authMapping: async (auth) => {
				return {
					Authorization: `Bearer ${auth}`,
				};
			},
		}),
	],
	triggers: [newFormResponse],
});
