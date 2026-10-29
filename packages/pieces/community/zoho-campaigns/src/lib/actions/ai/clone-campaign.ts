import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsCloneCampaignOutputSchema } from '../../output-schemas';

export const cloneCampaignAiAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_clone_campaign',
	outputSchema: zohoCampaignsCloneCampaignOutputSchema,
	displayName: 'Clone Campaign',
	description: 'Copies a campaign into a new draft.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Copies an existing campaign (key from List Campaigns) into a new draft, optionally overriding its name, subject, sender, reply-to and encoding. Not idempotent: each call creates a new campaign.',
		idempotent: false,
	},
	props: {
		campaignKey: zohoCampaignsAiProps.campaignKey({ required: true }),
		campaignName: Property.ShortText({
			displayName: 'Campaign Name',
			description: 'Name of the new campaign. Defaults to a copy of the original name.',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Subject line of the new campaign.',
			required: false,
		}),
		fromName: Property.ShortText({
			displayName: 'From Name',
			description: 'Sender display name.',
			required: false,
		}),
		fromEmail: Property.ShortText({
			displayName: 'From Email',
			description: 'Sender email address. It must be a verified sender in Zoho Campaigns.',
			required: false,
		}),
		replyTo: Property.ShortText({
			displayName: 'Reply-To Email',
			description: 'Reply-to email address.',
			required: false,
		}),
		encodeType: Property.ShortText({
			displayName: 'Encoding',
			description: 'Email character encoding, e.g. "UTF-8".',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.cloneCampaign({
			auth,
			campaignkey: propsValue.campaignKey,
			campaignname: propsValue.campaignName,
			subject: propsValue.subject,
			from_name: propsValue.fromName,
			from_add: propsValue.fromEmail,
			reply_to: propsValue.replyTo,
			encode_type: propsValue.encodeType,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
