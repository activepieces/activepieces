import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetSubscriptionStatisticsOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListSubscriptionStatisticsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_subscription_statistics',
	outputSchema: mailjetSubscriptionStatisticsOutputSchema,
	displayName: 'List Subscription Statistics',
	description: 'Lists engagement counts per contact per list.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists, per subscription (contact in a list), the sent, opened, clicked and bounced counts. Filter by list or contact. Page with Limit and Offset.',
		idempotent: true,
	},
	props: {
		contactsListId: Property.Number({
			displayName: 'Contact List ID',
			description: 'Only this contact list, from List Contact Lists.',
			required: false,
		}),
		contactId: Property.Number({
			displayName: 'Contact ID',
			description: 'Only this contact.',
			required: false,
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/listrecipientstatistics',
			query: {
				ContactsList: p.contactsListId,
				Contact: p.contactId,
				...mailjetUtils.pagingQuery(p),
			},
		});
	},
});
