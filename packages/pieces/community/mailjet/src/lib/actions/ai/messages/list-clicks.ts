import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetClickOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListClicksAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_clicks',
	outputSchema: mailjetClickOutputSchema,
	displayName: 'List Clicks',
	description: 'Lists link click events.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists click events with the message, contact, URL and time. Filter by campaign, list, message or period. Page with Limit and Offset.',
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
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: 'Only clicks in this message: its message ID, from Send Email or List Messages.',
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
			path: '/v3/REST/clickstatistics',
			query: {
				CampaignID: p.campaignId,
				ContactsList: p.contactsListId,
				MessageID: p.messageId,
				FromTS: p.fromTs,
				ToTS: p.toTs,
				...mailjetUtils.pagingQuery(p),
			},
		});
	},
});
