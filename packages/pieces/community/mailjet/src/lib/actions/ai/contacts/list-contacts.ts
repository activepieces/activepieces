import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetContactOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListContactsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_contacts',
	outputSchema: mailjetContactOutputSchema,
	displayName: 'List Contacts',
	description: 'Lists Mailjet contacts, optionally filtered by list or campaign.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists contacts with their IDs and emails. Filter by Contact List ID (from List Contact Lists) or Campaign ID. Page with Limit and Offset; the response has Total.',
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
			description: 'Only contacts that received this campaign, from List Campaigns.',
			required: false,
		}),
		isExcludedFromCampaigns: mailjetAiProps.yesNo({
			displayName: 'Excluded From Campaigns',
			description: 'Yes for excluded contacts only, No for the rest.',
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/contact',
			query: {
				ContactsList: p.contactsListId,
				Campaign: p.campaignId,
				IsExcludedFromCampaigns: p.isExcludedFromCampaigns,
				...mailjetUtils.pagingQuery(p),
			},
		});
	},
});
