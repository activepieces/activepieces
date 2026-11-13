import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsGetMailingListDetailsOutputSchema } from '../../output-schemas';

export const getMailingListDetailsAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_get_mailing_list_details',
	outputSchema: zohoCampaignsGetMailingListDetailsOutputSchema,
	displayName: 'Get Mailing List Details',
	description: 'Gets the contact stats and campaign history of a mailing list.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the advanced details of a mailing list (key from List Mailing Lists): contact stats (active, unsubscribed, bounced), subscriber locations, email clients and devices, and the campaigns sent or scheduled to it, filtered by Campaign Filter.',
		idempotent: true,
	},
	props: {
		listKey: zohoCampaignsAiProps.listKey({ required: true }),
		campaignFilter: Property.StaticDropdown<
			'sentcampaigns' | 'scheduledcampaigns' | 'recentcampaigns',
			false
		>({
			displayName: 'Campaign Filter',
			description: 'Which campaigns of the list to include. Defaults to the vendor default.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Sent Campaigns', value: 'sentcampaigns' },
					{ label: 'Scheduled Campaigns', value: 'scheduledcampaigns' },
					{ label: 'Recent Campaigns', value: 'recentcampaigns' },
				],
			},
		}),
		fromIndex: zohoCampaignsAiProps.fromIndex({ required: false }),
		range: zohoCampaignsAiProps.range({ required: false }),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.getMailingListDetails({
			auth,
			listkey: propsValue.listKey,
			filtertype: propsValue.campaignFilter,
			fromindex: propsValue.fromIndex,
			range: propsValue.range,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
