import { createAction } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { listListsOutputSchema } from '../../output-schemas';

export const listListsAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_list_lists',
	outputSchema: listListsOutputSchema,
	displayName: 'List Lists',
	description: 'Lists the mailing lists in the account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists EmailOctopus mailing lists one page at a time, with each list's ID, name, fields, tags and contact counts. Use it to find the list ID other actions need. Returns `paging.next.starting_after` for the next page.",
		idempotent: true,
	},
	props: {
		limit: emailOctopusAiProps.limit({ required: false }),
		startingAfter: emailOctopusAiProps.startingAfter({ required: false }),
	},
	async run(context) {
		const { limit, startingAfter } = context.propsValue;
		return await emailOctopusApi.listListsPage({
			auth: context.auth,
			limit: limit ?? undefined,
			startingAfter: startingAfter ?? undefined,
		});
	},
});
