import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import type { TallyQuestion } from '../common/types';
import { listFormQuestionsOutputSchema } from '../output-schemas';

export const listFormQuestions = createAction({
	auth: tallyAuth,
	name: 'list_form_questions',
	displayName: 'List Form Questions',
	description: 'Lists all questions defined in a form.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Lists every question defined in a Tally form, returning each with id, type, title, and any question-specific fields (matrix rows, option lists). Use to build a question id → title map before parsing raw submission responses, since submissions reference answers by question id. Obtain the form id from List Forms.",
		idempotent: true,
	},
	outputSchema: listFormQuestionsOutputSchema,
	props: {
		form_id: Property.ShortText({
			displayName: 'Form ID',
			description: 'The id of the form. Obtain from List Forms.',
			required: true,
		}),
	},
	async run(context) {
		return tallyApiClient.request<TallyQuestion[]>({
			method: HttpMethod.GET,
			path: `/forms/${context.propsValue.form_id}/questions`,
			apiKey: context.auth.secret_text,
		});
	},
});
