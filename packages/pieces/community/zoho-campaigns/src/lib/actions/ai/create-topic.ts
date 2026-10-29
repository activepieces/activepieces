import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsCreateTopicOutputSchema } from '../../output-schemas';

export const createTopicAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_create_topic',
	outputSchema: zohoCampaignsCreateTopicOutputSchema,
	displayName: 'Create Topic',
	description: 'Creates a subscription topic, optionally under a product.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a subscription topic contacts can subscribe to, and returns its topic_id. Needs topic management on the account. Not idempotent, and topics cannot be deleted through the API.',
		idempotent: false,
	},
	props: {
		topicName: Property.ShortText({
			displayName: 'Topic Name',
			description: 'Name of the topic.',
			required: true,
		}),
		topicDescription: Property.ShortText({
			displayName: 'Topic Description',
			description: 'Description of the topic.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.createTopic({
			auth,
			topicName: propsValue.topicName,
			topicDesc: propsValue.topicDescription,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
