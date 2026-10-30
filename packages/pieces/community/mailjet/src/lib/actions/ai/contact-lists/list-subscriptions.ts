import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetSubscriptionOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListSubscriptionsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_subscriptions',
	outputSchema: mailjetSubscriptionOutputSchema,
	displayName: 'List Subscriptions',
	description: 'Lists contact-in-list subscription records.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists subscription records (one per contact per list) with their IDs and unsubscribed state. Filter by contact list, contact or email. Page with Limit and Offset.',
		idempotent: true,
	},
	props: {
		contactsListId: Property.Number({
			displayName: 'Contact List ID',
			description: 'Only subscriptions in this list.',
			required: false,
		}),
		contactId: Property.Number({
			displayName: 'Contact ID',
			description: 'Only subscriptions of this contact.',
			required: false,
		}),
		contactEmail: Property.ShortText({
			displayName: 'Contact Email',
			description: 'Only subscriptions of the contact with this email.',
			required: false,
		}),
		unsub: mailjetAiProps.yesNo({
			displayName: 'Unsubscribed',
			description: 'Yes for unsubscribed records only, No for subscribed only.',
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/listrecipient',
			query: {
				ContactsList: p.contactsListId,
				Contact: p.contactId,
				ContactEmail: p.contactEmail,
				Unsub: p.unsub,
				...mailjetUtils.pagingQuery(p),
			},
		});
	},
});
