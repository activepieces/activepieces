import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetBounceOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListBouncesAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_bounces',
	outputSchema: mailjetBounceOutputSchema,
	displayName: 'List Bounces',
	description: 'Lists bounce events.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists bounce events with the message, contact, hard/soft flag and error. Filter by campaign, list or period. Page with Limit and Offset.',
		idempotent: true,
	},
	props: {
		campaignId: Property.Number({
			displayName: 'Campaign ID',
			description: 'Only this campaign, from List Campaigns.',
			required: false,
		}),
		contactsListId: Property.Number({
			displayName: 'Contact List ID',
			description: 'Only this contact list, from List Contact Lists.',
			required: false,
		}),
		fromTs: Property.ShortText({
			displayName: 'From',
			description: 'Start of the period, RFC 3339 or Unix timestamp.',
			required: false,
		}),
		toTs: Property.ShortText({
			displayName: 'To',
			description: 'End of the period, RFC 3339 or Unix timestamp.',
			required: false,
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/bouncestatistics',
			query: {
				CampaignID: p.campaignId,
				ContactsList: p.contactsListId,
				FromTS: p.fromTs,
				ToTS: p.toTs,
				...mailjetUtils.pagingQuery(p),
			},
		});
	},
});
