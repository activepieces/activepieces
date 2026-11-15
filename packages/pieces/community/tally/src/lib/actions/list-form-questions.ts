import { createAction } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { formsDropdown } from '../common/props';
import { listFormQuestionsActionOutputSchema } from '../output-schemas';

export const listFormQuestionsAction = createAction({
	auth: tallyAuth,
	name: 'list_form_questions',
	classification: 'SEARCH',
	displayName: 'List Form Questions',
	description: 'List the questions on a form, with their ids and titles',
	audience: 'ai',
	outputSchema: listFormQuestionsActionOutputSchema,
	aiMetadata: {
		description:
			'Lists a form\'s questions with their ids, titles, and types. Use to resolve a questionId to its label before reading List Submissions / Get Submission responses, since raw submission answers are keyed by questionId, not by label. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		form_id: formsDropdown,
	},
	async run(context) {
		const { auth, propsValue } = context;
		return tallyApiClient.listFormQuestions({ apiKey: auth.secret_text, formId: propsValue.form_id });
	},
});
