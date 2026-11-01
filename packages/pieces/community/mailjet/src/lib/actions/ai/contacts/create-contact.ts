import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetContactOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetCreateContactAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_create_contact',
	outputSchema: mailjetContactOutputSchema,
	displayName: 'Create Contact',
	description: 'Creates a Mailjet contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a contact in the account. Fails if the email already exists; use Get Contact to check first. To add the contact to a list use Add Contact to List, and to set property values use Update Contact Data.',
		idempotent: false,
	},
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Contact email address. Must not exist yet.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Contact display name.',
			required: false,
		}),
		isExcludedFromCampaigns: mailjetAiProps.yesNo({
			displayName: 'Excluded From Campaigns',
			description: 'Yes adds the contact to the campaign exclusion list.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: '/v3/REST/contact',
			body: { Email: p.email, Name: p.name, IsExcludedFromCampaigns: p.isExcludedFromCampaigns },
		});
	},
});
