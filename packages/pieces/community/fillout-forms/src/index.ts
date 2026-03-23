import { createPiece } from '@activepieces/pieces-framework';
import { getFormResponses } from './lib/actions/get-form-responses';
import { getSingleResponse } from './lib/actions/get-single-response';
import { findFormByTitle } from './lib/actions/find-form-by-title';
import { newFormResponse } from './lib/triggers/new-form-response';
import { createCustomApiCallAction, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { makeRequest } from './lib/common';
import { filloutFormsAuth } from './lib/auth';

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
					Authorization: `Bearer ${auth.secret_text}`,
				};
			},
		}),
	],
	triggers: [newFormResponse],
});
