import { createAction, Property } from '@activepieces/pieces-framework';

import { opnformAuth } from '../../../auth';
import { opnformAiProps } from '../../../common/ai-props';
import { opnformApi } from '../../../common/api';
import { opnformDeleteSubmissionOutputSchema } from '../../../output-schemas';

export const opnformDeleteSubmissionAction = createAction({
	auth: opnformAuth,
	name: 'opnform_delete_submission',
	outputSchema: opnformDeleteSubmissionOutputSchema,
	displayName: 'Delete Submission',
	description: 'Permanently deletes a submission.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes one submission of a form. Cannot be undone.',
		idempotent: false,
	},
	props: {
		formId: opnformAiProps.formId({ required: true }),
		submissionId: Property.ShortText({
			displayName: 'Submission ID',
			description: 'Numeric submission ID, from List Submissions.',
			required: true,
		}),
	},
	async run(context) {
		const { formId, submissionId } = context.propsValue;
		return await opnformApi.deleteSubmission({ auth: context.auth, formId, submissionId });
	},
});
