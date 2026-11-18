import { createAction } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { listTagsOutputSchema } from '../../output-schemas';

export const listTagsAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_list_tags',
	outputSchema: listTagsOutputSchema,
	displayName: 'List Tags',
	description: 'Lists the tags on a list.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the tags defined on an EmailOctopus list, one page at a time. Returns `paging.next.starting_after` for the next page.',
		idempotent: true,
	},
	props: {
		listId: emailOctopusAiProps.listId({ required: true }),
		limit: emailOctopusAiProps.limit({ required: false }),
		startingAfter: emailOctopusAiProps.startingAfter({ required: false }),
	},
	async run(context) {
		const { listId, limit, startingAfter } = context.propsValue;
		return await emailOctopusApi.listTags({
			auth: context.auth,
			listId,
			limit: limit ?? undefined,
			startingAfter: startingAfter ?? undefined,
		});
	},
});
