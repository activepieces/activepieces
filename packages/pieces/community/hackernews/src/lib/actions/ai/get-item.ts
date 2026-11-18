import { createAction, Property } from '@activepieces/pieces-framework';

import { hackernewsApi } from '../../common/api';
import { hackernewsGetItemOutputSchema } from '../../output-schemas';

export const getItemAction = createAction({
	name: 'hackernews_get_item',
	outputSchema: hackernewsGetItemOutputSchema,
	displayName: 'Get Item',
	description: 'Gets a Hacker News story, comment, job, poll or poll option by its id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fetches one Hacker News item (story, comment, job, poll or poll option) by its numeric id. Ids come from the List … Stories actions, from kid_ids / parent_id of another item, from Get User, or from Get Updates. To read a discussion, call this on the ids in kid_ids; it does not return nested comments.',
		idempotent: true,
	},
	props: {
		itemId: Property.Number({
			displayName: 'Item ID',
			description: 'The numeric id of the item, e.g. 8863.',
			required: true,
		}),
	},
	async run({ propsValue }) {
		return await hackernewsApi.findItem({ itemId: propsValue.itemId });
	},
});
