import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsListTopicsOutputSchema } from '../../output-schemas';

export const listTopicsAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_list_topics',
	outputSchema: zohoCampaignsListTopicsOutputSchema,
	displayName: 'List Topics',
	description: 'Lists the subscription topics in the account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the subscription topics in the account with their topic IDs and names. Use a topic ID in Create Campaign, Subscribe Contact or Unsubscribe Contact.',
		idempotent: true,
	},
	props: {
		fromIndex: Property.Number({
			displayName: 'From Index',
			description: 'The 0-based position of the first record to return.',
			required: false,
		}),
		range: Property.Number({
			displayName: 'Range',
			description: 'How many records to return.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.getTopics({
			auth,
			fromIndex: propsValue.fromIndex,
			range: propsValue.range,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
