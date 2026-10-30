import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderSuccessOutputSchema } from '../../output-schemas';

export const senderDeleteFieldAction = createAction({
	auth: senderAuth,
	name: 'sender_delete_field',
	outputSchema: senderSuccessOutputSchema,
	displayName: 'Delete Field',
	description: 'Deletes a custom field.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Deletes a custom subscriber field and the values stored in it. Cannot be undone.',
		idempotent: false,
	},
	props: {
		fieldId: senderAiProps.fieldId({ required: true }),
	},
	async run(context) {
		return await senderApi.deleteField({ auth: context.auth, ...context.propsValue });
	},
});
