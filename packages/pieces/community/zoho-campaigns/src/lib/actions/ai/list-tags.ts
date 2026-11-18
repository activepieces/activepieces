import { createAction } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsListTagsOutputSchema } from '../../output-schemas';

const NO_TAGS_CODE = '992';

export const listTagsAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_list_tags',
	outputSchema: zohoCampaignsListTagsOutputSchema,
	displayName: 'List Tags',
	description: 'Lists every contact tag with its description and contact count.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every contact tag in the account with its tag ID, name, description, color, owner and how many contacts carry it. Tag actions identify tags by name. Returns an empty tags list when the account has no tags.',
		idempotent: true,
	},
	props: {},
	async run({ auth }) {
		const body = await zohoCampaignsApi.getAllTags({ auth });
		if (String(body.code) === NO_TAGS_CODE) {
			return { tags: [] };
		}
		const tags = zohoCampaignsUtils.assertSuccess({ body }).tags ?? [];
		return {
			tags: tags.flatMap((tagMap) =>
				Object.entries(tagMap).map(([tagId, tag]) => ({ tag_id: tagId, ...tag })),
			),
		};
	},
});
