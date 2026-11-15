import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetContactDataOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListContactDataAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_contact_data',
	outputSchema: mailjetContactDataOutputSchema,
	displayName: 'List Contact Data',
	description: 'Lists contact property values for many contacts.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the property values of contacts, filtered by contact list, campaign or email. Page with Limit and Offset. For one contact use Get Contact Data.',
		idempotent: true,
	},
	props: {
		contactsListId: Property.Number({
			displayName: 'Contact List ID',
			description: 'Only contacts in this list, from List Contact Lists.',
			required: false,
		}),
		campaignId: Property.Number({
			displayName: 'Campaign ID',
			description: 'Only contacts that received this campaign.',
			required: false,
		}),
		contactEmail: Property.ShortText({
			displayName: 'Contact Email',
			description: 'Only the contact with this email.',
			required: false,
		}),
		fields: Property.ShortText({
			displayName: 'Fields',
			description: 'Comma-separated property names to return; all properties when empty.',
			required: false,
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/contactdata',
			query: {
				ContactsList: p.contactsListId,
				Campaign: p.campaignId,
				ContactEmail: p.contactEmail,
				Fields: p.fields,
				...mailjetUtils.pagingQuery(p),
			},
		});
	},
});
