import { createAction, Property } from '@activepieces/pieces-framework';

import { opnformAuth } from '../../../auth';
import { opnformAiProps } from '../../../common/ai-props';
import { opnformApi } from '../../../common/api';
import { opnformUpdateSubmissionOutputSchema } from '../../../output-schemas';

export const opnformUpdateSubmissionAction = createAction({
	auth: opnformAuth,
	name: 'opnform_update_submission',
	outputSchema: opnformUpdateSubmissionOutputSchema,
	displayName: 'Update Submission',
	description: "Changes some of a submission's answers.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes some of a submission's answers; answers not passed keep their value. Answers are keyed by field id from Get Form, and the submission id comes from List Submissions.",
		idempotent: true,
	},
	props: {
		formId: opnformAiProps.formId({ required: true }),
		submissionId: Property.ShortText({
			displayName: 'Submission ID',
			description: 'Numeric submission ID, from List Submissions or Create Submission.',
			required: true,
		}),
		answers: Property.Json({
			displayName: 'Answers',
			description:
				'JSON object of the answers to change, keyed by field id (from Get Form), e.g. {"3700d380-197b-47b9-a008-3acc31bbd506": "Alice Smith"}.',
			required: true,
		}),
	},
	async run(context) {
		const { formId, submissionId, answers } = context.propsValue;
		return await opnformApi.updateSubmission({
			auth: context.auth,
			formId,
			submissionId,
			body: answers,
		});
	},
});
