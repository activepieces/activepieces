import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsCreateCampaignOutputSchema } from '../../output-schemas';

export const createCampaignAiAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_create_campaign',
	outputSchema: zohoCampaignsCreateCampaignOutputSchema,
	displayName: 'Create Campaign',
	description: 'Creates a draft email campaign.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a draft email campaign addressed to mailing lists (keys from List Mailing Lists) and/or segments, which must hold at least one contact, and returns its campaignKey for Send Campaign or Schedule Campaign. Give a public Content URL, or the campaign has no content and cannot be sent. Accounts using topic management also need a Topic ID (from List Topics). Not idempotent: each call creates a new campaign.',
		idempotent: false,
	},
	props: {
		campaignName: Property.ShortText({
			displayName: 'Campaign Name',
			description: 'Internal name of the campaign.',
			required: true,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Email subject line.',
			required: true,
		}),
		fromEmail: Property.ShortText({
			displayName: 'From Email',
			description: 'Sender email address. It must be a verified sender in Zoho Campaigns.',
			required: true,
		}),
		fromName: Property.ShortText({
			displayName: 'From Name',
			description: 'Sender display name.',
			required: false,
		}),
		contentUrl: Property.ShortText({
			displayName: 'Content URL',
			description: 'Public URL of the HTML page to import as the email content.',
			required: false,
		}),
		listKeys: Property.Array({
			displayName: 'Mailing List Keys',
			description:
				'Keys of the mailing lists to send to (from List Mailing Lists). Lists take precedence when segments are also given.',
			required: false,
		}),
		segmentIds: Property.Array({
			displayName: 'Segment IDs',
			description: 'Segment IDs (cvid) to send to, from the segments of List Mailing Lists.',
			required: false,
		}),
		topicId: Property.ShortText({
			displayName: 'Topic ID',
			description: 'Topic ID from List Topics. Required on accounts that use topic management.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const listKeys = propsValue.listKeys?.map(String);
		const segmentIds = propsValue.segmentIds?.map(String);
		if ((listKeys ?? []).length === 0 && (segmentIds ?? []).length === 0) {
			throw new Error('Give at least one List Key or Segment ID to address the campaign to.');
		}
		const body = await zohoCampaignsApi.createCampaign({
			auth,
			campaignname: propsValue.campaignName,
			subject: propsValue.subject,
			from_email: propsValue.fromEmail,
			...(propsValue.fromName && { from_name: propsValue.fromName }),
			...(propsValue.contentUrl && { content_url: propsValue.contentUrl }),
			...(listKeys && listKeys.length > 0 && { list_details: listKeys }),
			...(segmentIds && segmentIds.length > 0 && { segments: segmentIds }),
			topicId: propsValue.topicId,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
