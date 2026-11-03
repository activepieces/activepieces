import { createAction } from '@activepieces/pieces-framework';

import { opnformAuth } from '../../../auth';
import { opnformAiProps } from '../../../common/ai-props';
import { opnformApi } from '../../../common/api';
import { opnformDeleteFormOutputSchema } from '../../../output-schemas';

export const opnformDeleteFormAction = createAction({
	auth: opnformAuth,
	name: 'opnform_delete_form',
	outputSchema: opnformDeleteFormOutputSchema,
	displayName: 'Delete Form',
	description: 'Deletes a form.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes a form by its numeric id (from List Forms). There is no restore endpoint in the API.',
		idempotent: false,
	},
	props: {
		formId: opnformAiProps.formId({ required: true }),
	},
	async run(context) {
		const { formId } = context.propsValue;
		await opnformApi.deleteForm({ auth: context.auth, formId });
		return { success: true, form_id: formId };
	},
});
