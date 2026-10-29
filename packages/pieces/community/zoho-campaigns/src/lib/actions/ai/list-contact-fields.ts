import { createAction } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsListContactFieldsOutputSchema } from '../../output-schemas';

export const listContactFieldsAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_list_contact_fields',
	outputSchema: zohoCampaignsListContactFieldsOutputSchema,
	displayName: 'List Contact Fields',
	description: 'Lists every contact field, standard and custom.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every contact field in the account, standard and custom, with display name, internal name and field ID. Use the display names as keys in the Additional Fields of Subscribe Contact.',
		idempotent: true,
	},
	props: {},
	async run({ auth }) {
		const body = await zohoCampaignsApi.listContactFields({ auth });
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
