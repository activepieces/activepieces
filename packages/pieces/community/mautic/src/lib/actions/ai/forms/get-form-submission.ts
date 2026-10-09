import { createAction } from '@activepieces/pieces-framework';

import { mauticGetFormSubmissionOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetFormSubmissionAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_form_submission',
	outputSchema: mauticGetFormSubmissionOutputSchema,
	displayName: 'Get Form Submission',
	description: 'Gets one submission of a Mautic form.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single form submission by id with the submitted values.',
		idempotent: true,
	},
	props: {
		formId: mauticAiProps.recordId({
			displayName: 'Form Id',
			description: 'Numeric form id, from List Forms.',
		}),
		submissionId: mauticAiProps.recordId({
			displayName: 'Submission Id',
			description: 'Numeric submission id, from List Form Submissions.',
		}),
	},
	async run(context) {
		return await mauticApi.getFormSubmission({
			auth: context.auth,
			formId: context.propsValue.formId,
			submissionId: context.propsValue.submissionId,
		});
	},
});
