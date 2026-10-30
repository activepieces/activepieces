import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetMessageOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListMessagesAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_messages',
	outputSchema: mailjetMessageOutputSchema,
	displayName: 'List Messages',
	description: 'Lists sent messages.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists sent messages with their IDs, status and arrival time. Filter by campaign, contact, custom ID or period. Page with Limit and Offset.',
		idempotent: true,
	},
	props: {
		campaignId: Property.Number({
			displayName: 'Campaign ID',
			description: 'Only this campaign, from List Campaigns.',
			required: false,
		}),
		contactId: Property.Number({
			displayName: 'Contact ID',
			description: 'Only messages to this contact.',
			required: false,
		}),
		customId: Property.ShortText({
			displayName: 'Custom ID',
			description: 'Only messages sent with this Custom ID.',
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
		showSubject: mailjetAiProps.yesNo({
			displayName: 'Show Subject',
			description: 'Yes adds the subject to each message.',
		}),
		showContactAlt: mailjetAiProps.yesNo({
			displayName: 'Show Recipient Email',
			description: 'Yes adds the recipient email to each message.',
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/message',
			query: {
				Campaign: p.campaignId,
				Contact: p.contactId,
				CustomID: p.customId,
				FromTS: p.fromTs,
				ToTS: p.toTs,
				ShowSubject: p.showSubject,
				ShowContactAlt: p.showContactAlt,
				...mailjetUtils.pagingQuery(p),
			},
		});
	},
});
