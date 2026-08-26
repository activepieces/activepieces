import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import type { TallySubmissionResponse } from '../common/types';
import { getFormSubmissionOutputSchema } from '../output-schemas';

export const getFormSubmission = createAction({
	auth: tallyAuth,
	name: 'get_form_submission',
	displayName: 'Get Form Submission',
	description: 'Fetches a single submission by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Fetches a single submission by (form id, submission id). Returns the submission with respondent id, submitted timestamp, completion flag, and its raw `responses` array (each response references a question by id). Use to deep-read one submission after listing; pair with List Form Questions to translate question ids to human titles.",
		idempotent: true,
	},
	outputSchema: getFormSubmissionOutputSchema,
	props: {
		form_id: Property.ShortText({
			displayName: 'Form ID',
			description: 'The id of the form. Obtain from List Forms.',
			required: true,
		}),
		submission_id: Property.ShortText({
			displayName: 'Submission ID',
			description: 'The id of the submission. Obtain from List Form Submissions.',
			required: true,
		}),
	},
	async run(context) {
		return tallyApiClient.request<TallySubmissionResponse>({
			method: HttpMethod.GET,
			path: `/forms/${context.propsValue.form_id}/submissions/${context.propsValue.submission_id}`,
			apiKey: context.auth.secret_text,
		});
	},
});
