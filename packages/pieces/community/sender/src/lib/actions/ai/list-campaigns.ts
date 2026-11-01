import { createAction, Property } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderListCampaignsOutputSchema } from '../../output-schemas';

export const senderListCampaignsAction = createAction({
	auth: senderAuth,
	name: 'sender_list_campaigns',
	outputSchema: senderListCampaignsOutputSchema,
	displayName: 'List Campaigns',
	description: 'Lists one page of email campaigns.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of email campaigns with their ID, title, subject, status, schedule and send stats, optionally filtered by status. Use it to find a campaign ID. Page through with Page and Limit using the returned meta.',
		idempotent: true,
	},
	props: {
		page: senderAiProps.page({ required: false }),
		limit: senderAiProps.limit({ required: false }),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only return campaigns with this status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Draft', value: 'DRAFT' },
					{ label: 'Scheduled', value: 'SCHEDULED' },
					{ label: 'Sending', value: 'SENDING' },
					{ label: 'Sent', value: 'SENT' },
				],
			},
		}),
	},
	async run(context) {
		return await senderApi.listCampaigns({ auth: context.auth, ...context.propsValue });
	},
});
