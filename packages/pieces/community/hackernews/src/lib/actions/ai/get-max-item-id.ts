import { createAction } from '@activepieces/pieces-framework';

import { hackernewsApi } from '../../common/api';
import { hackernewsGetMaxItemIdOutputSchema } from '../../output-schemas';

export const getMaxItemIdAction = createAction({
	name: 'hackernews_get_max_item_id',
	outputSchema: hackernewsGetMaxItemIdOutputSchema,
	displayName: 'Get Max Item ID',
	description: 'Gets the id of the newest item on Hacker News.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the largest item id on Hacker News, i.e. the most recently created story, comment or job. Item ids are sequential, so counting down from this id walks every new item; pass an id to Get Item to read it.',
		idempotent: true,
	},
	props: {},
	async run() {
		return await hackernewsApi.getMaxItemId();
	},
});
