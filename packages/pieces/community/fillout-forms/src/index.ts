import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { getFormResponses } from './lib/actions/get-form-responses';
import { getSingleResponse } from './lib/actions/get-single-response';
import { findFormByTitle } from './lib/actions/find-form-by-title';
import { newFormResponse } from './lib/triggers/new-form-response';
import { BASE_URL } from './lib/common';
import { filloutFormsAuth } from './lib/auth';

export const filloutForms = createPiece({
	displayName: 'Fillout Forms',
	description: 'Create interactive forms and automate workflows with Fillout',
	auth: filloutFormsAuth,
	minimumSupportedRelease: '0.88.2',
	logoUrl: 'https://cdn.activepieces.com/pieces/fillout-forms.png',
	categories: [PieceCategory.FORMS_AND_SURVEYS],
	authors: ['Sanket6652', 'onyedikachi-david'],
	actions: [
		getFormResponses,
		getSingleResponse,
		findFormByTitle,
		createCustomApiCallAction({
			auth: filloutFormsAuth,
			baseUrl: () => BASE_URL,
			authMapping: async (auth) => {
				return {
					Authorization: `Bearer ${auth.secret_text}`,
				};
			},
			props: {
				url: {
					description: `Full URL, or a path relative to ${BASE_URL}`,
					placeholder: '/forms',
				},
			},
		}),
	],
	triggers: [newFormResponse],
});
