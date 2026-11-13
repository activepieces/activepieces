import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickListTagsOutputSchema } from '../../output-schemas';

export const listTagsAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_list_tags',
	outputSchema: ticktickListTagsOutputSchema,
	displayName: 'List Tags',
	description: 'Lists the tags of the connected account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists all tags with their names and labels. Use to check whether a tag exists before ticktick_create_tag, or to find tag names for task filters. Read-only.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const tags = await tickTickApiCall<Record<string, unknown>[]>({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: '/tag',
		});
		return { tags, count: tags.length };
	},
});
