import { createAction } from '@activepieces/pieces-framework';

import { mailjetContactPropertyOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetContactPropertyAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_contact_property',
	outputSchema: mailjetContactPropertyOutputSchema,
	displayName: 'Get Contact Property',
	description: 'Gets one contact property definition.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a contact property definition by its numeric ID or its name.',
		idempotent: true,
	},
	props: {
		propertyId: mailjetAiProps.id({
			displayName: 'Property ID or Name',
			description: 'Numeric property ID (from List Contact Properties) or the property name.',
		}),
	},
	async run(context) {
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/contactmetadata/${encodeURIComponent(context.propsValue.propertyId)}`,
		});
	},
});
