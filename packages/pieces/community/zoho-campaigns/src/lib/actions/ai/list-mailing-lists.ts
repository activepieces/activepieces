import { createAction } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsListMailingListsOutputSchema } from '../../output-schemas';

export const listMailingListsAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_list_mailing_lists',
	outputSchema: zohoCampaignsListMailingListsOutputSchema,
	displayName: 'List Mailing Lists',
	description: 'Lists mailing lists with their keys, sizes and segments.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the mailing lists in the account with their list keys, names, contact, unsubscribe and bounce counts, and their segments (segment IDs). Paged with From Index and Range. Use it to find the list key other actions need.',
		idempotent: true,
	},
	props: {
		sort: zohoCampaignsAiProps.sort({ required: false }),
		fromIndex: zohoCampaignsAiProps.fromIndex({ required: false }),
		range: zohoCampaignsAiProps.range({ required: false }),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.getMailingLists({
			auth,
			sort: propsValue.sort,
			fromindex: propsValue.fromIndex,
			range: propsValue.range,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
