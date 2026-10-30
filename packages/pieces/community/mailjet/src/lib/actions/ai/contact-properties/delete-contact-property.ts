import { createAction } from '@activepieces/pieces-framework';

import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetDeletedOutputSchema } from '../../../output-schemas';

export const mailjetDeleteContactPropertyAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_delete_contact_property',
	outputSchema: mailjetDeletedOutputSchema,
	displayName: 'Delete Contact Property',
	description: 'Deletes a contact property definition.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes a contact property and the values every contact held for it. Cannot be undone.',
		idempotent: false,
	},
	props: {
		propertyId: mailjetAiProps.id({
			displayName: 'Property ID',
			description: 'Numeric property ID, from List Contact Properties.',
		}),
	},
	async run(context) {
		return await mailjetApi.remove({
			auth: context.auth,
			path: `/v3/REST/contactmetadata/${encodeURIComponent(context.propsValue.propertyId)}`,
		});
	},
});
