import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetContactOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetUpdateContactAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_update_contact',
	outputSchema: mailjetContactOutputSchema,
	displayName: 'Update Contact',
	description: 'Updates the name or campaign exclusion of a Mailjet contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates a contact name and/or campaign exclusion. Only the fields you set change. Contact property values are changed with Update Contact Data instead.',
		idempotent: true,
	},
	props: {
		contactId: mailjetAiProps.id({
			displayName: 'Contact ID or Email',
			description:
				'Numeric contact ID (from List Contacts or Create Contact) or the contact email.',
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New display name.',
			required: false,
		}),
		isExcludedFromCampaigns: mailjetAiProps.yesNo({
			displayName: 'Excluded From Campaigns',
			description: 'Yes excludes the contact from marketing campaigns, No includes it again.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.put({
			auth: context.auth,
			path: `/v3/REST/contact/${encodeURIComponent(p.contactId)}`,
			body: { Name: p.name, IsExcludedFromCampaigns: p.isExcludedFromCampaigns },
		});
	},
});
