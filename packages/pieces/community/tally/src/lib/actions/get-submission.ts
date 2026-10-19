import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { formsDropdown } from '../common/props';
import { getSubmissionActionOutputSchema } from '../output-schemas';

export const getSubmissionAction = createAction({
	auth: tallyAuth,
	name: 'get_submission',
	classification: 'READ',
	displayName: 'Get Submission',
	description: 'Get a single submission by id',
	audience: 'ai',
	outputSchema: getSubmissionActionOutputSchema,
	aiMetadata: {
		description:
			'Fetches one submission by id with its full set of responses, plus the form\'s questions for label resolution. Use List Submissions or the New Submission trigger to obtain a submission id first. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		form_id: formsDropdown,
		submission_id: Property.ShortText({
			displayName: 'Submission ID',
			description: 'Obtain from List Submissions or the New Submission trigger payload.',
			required: true,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		return tallyApiClient.getSubmission({
			apiKey: auth.secret_text,
			formId: propsValue.form_id,
			submissionId: propsValue.submission_id,
		});
	},
});
