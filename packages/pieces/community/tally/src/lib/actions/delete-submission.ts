import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { formsDropdown } from '../common/props';

export const deleteSubmissionAction = createAction({
	auth: tallyAuth,
	name: 'delete_submission',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Submission',
	description: 'Permanently delete a single submission',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes one submission by id — irreversible, no trash/undo. Use List Submissions or Get Submission first to confirm you have the right one. A repeat call errors once the submission is gone, so this is not idempotent.',
		idempotent: false,
	},
	props: {
		form_id: formsDropdown,
		submission_id: Property.ShortText({
			displayName: 'Submission ID',
			description: 'Obtain from List Submissions or Get Submission.',
			required: true,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		await tallyApiClient.deleteSubmission({
			apiKey: auth.secret_text,
			formId: propsValue.form_id,
			submissionId: propsValue.submission_id,
		});
		return { formId: propsValue.form_id, submissionId: propsValue.submission_id, deleted: true };
	},
});
