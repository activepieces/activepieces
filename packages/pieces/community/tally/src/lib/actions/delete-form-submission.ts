import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';

export const deleteFormSubmission = createAction({
	auth: tallyAuth,
	name: 'delete_form_submission',
	displayName: 'Delete Form Submission',
	description: 'Deletes a specific submission from a form.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			"Permanently deletes a single submission from a form. This is not recoverable through the API — the submission is removed from Tally's records. Retries after the first success return the same 'deleted' confirmation but the underlying record is already gone; treat re-invocation as idempotent from the caller's perspective. Only use when the caller has explicitly asked to purge a submission (GDPR request, test data cleanup); prefer leaving submissions in place.",
		idempotent: true,
	},
	props: {
		form_id: Property.ShortText({
			displayName: 'Form ID',
			description: 'The id of the form. Obtain from List Forms.',
			required: true,
		}),
		submission_id: Property.ShortText({
			displayName: 'Submission ID',
			description: 'The id of the submission to delete. Obtain from List Form Submissions.',
			required: true,
		}),
	},
	async run(context) {
		await tallyApiClient.request<void>({
			method: HttpMethod.DELETE,
			path: `/forms/${context.propsValue.form_id}/submissions/${context.propsValue.submission_id}`,
			apiKey: context.auth.secret_text,
		});
		return {
			form_id: context.propsValue.form_id,
			submission_id: context.propsValue.submission_id,
			deleted: true,
		};
	},
});
