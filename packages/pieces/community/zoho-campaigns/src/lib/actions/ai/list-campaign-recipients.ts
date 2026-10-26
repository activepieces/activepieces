import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsListCampaignRecipientsOutputSchema } from '../../output-schemas';

import type { ZohoCampaignsRecipientAction } from '../../common/types';

export const listCampaignRecipientsAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_list_campaign_recipients',
	displayName: 'List Campaign Recipients',
	description:
		'Lists the recipients of a sent campaign by what they did, such as opened or clicked.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the recipients of a sent campaign (key from List Sent Campaigns) filtered by activity: sent, opened, unopened, clicked, opted out, marked as spam, hard or soft bounced, or not sent. Paged with From Index and Range.',
		idempotent: true,
	},
	outputSchema: zohoCampaignsListCampaignRecipientsOutputSchema,
	props: {
		campaignKey: zohoCampaignsAiProps.campaignKey({ required: true }),
		activity: Property.StaticDropdown<ZohoCampaignsRecipientAction, true>({
			displayName: 'Activity',
			description: 'Which recipients to return.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Sent', value: 'sentcontacts' },
					{ label: 'Opened', value: 'openedcontacts' },
					{ label: 'Unopened', value: 'unopenedcontacts' },
					{ label: 'Clicked', value: 'clickedcontacts' },
					{ label: 'Opted Out', value: 'optoutcontacts' },
					{ label: 'Marked as Spam', value: 'spamcontacts' },
					{ label: 'Hard Bounced', value: 'senthardbounce' },
					{ label: 'Soft Bounced', value: 'sentsoftbounce' },
					{ label: 'Not Sent', value: 'unsentcontacts' },
				],
			},
		}),
		fromIndex: zohoCampaignsAiProps.fromIndex({ required: false }),
		range: zohoCampaignsAiProps.range({ required: false }),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.listCampaignRecipients({
			auth,
			campaignkey: propsValue.campaignKey,
			action: propsValue.activity,
			fromindex: propsValue.fromIndex,
			range: propsValue.range,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
