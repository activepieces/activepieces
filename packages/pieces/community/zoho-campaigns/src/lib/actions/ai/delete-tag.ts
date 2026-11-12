import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsStatusOutputSchema } from '../../output-schemas';

export const deleteTagAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_delete_tag',
	outputSchema: zohoCampaignsStatusOutputSchema,
	displayName: 'Delete Tag',
	description: 'Permanently deletes a tag from the account.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a tag (by name, from List Tags) from the account and from every contact that carries it. Use Remove Tag from Contact to untag one contact. Cannot be undone.',
		idempotent: false,
	},
	props: {
		tagName: Property.ShortText({
			displayName: 'Tag Name',
			description: 'Name of the tag, as shown by List Tags.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.deleteTag({ auth, tagName: propsValue.tagName });
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
