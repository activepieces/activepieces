import { createAction } from '@activepieces/pieces-framework';

import { opnformAuth } from '../../../auth';
import { opnformAiProps } from '../../../common/ai-props';
import { opnformApi } from '../../../common/api';
import { opnformGetFormOutputSchema } from '../../../output-schemas';

export const opnformGetFormAction = createAction({
	auth: opnformAuth,
	name: 'opnform_get_form',
	outputSchema: opnformGetFormOutputSchema,
	displayName: 'Get Form',
	description: 'Gets a form with all its settings and fields.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one form by slug or UUID, including its settings and its fields (`properties`, each with the field id used as the answer key in Create Submission, Update Submission and Export Submissions).',
		idempotent: true,
	},
	props: {
		formSlug: opnformAiProps.formSlug({ required: true }),
	},
	async run(context) {
		return await opnformApi.getForm({ auth: context.auth, formSlug: context.propsValue.formSlug });
	},
});
