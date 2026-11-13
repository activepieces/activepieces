import { createAction, Property } from '@activepieces/pieces-framework';

import { robollyAuth } from '../../auth';
import { robollyAiProps } from '../../common/ai-props';
import { robollyApi } from '../../common/api';
import { robollyListRendersOutputSchema } from '../../output-schemas';

export const listRendersAction = createAction({
	auth: robollyAuth,
	name: 'robolly_list_renders',
	outputSchema: robollyListRendersOutputSchema,
	displayName: 'List Renders',
	description: 'Lists past renders, newest first, 30 per page.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists past renders, newest first, up to 30 per page, optionally filtered by template, movie or cache hash. Pass paginationCursorNext from the previous page as the cursor to get the next page, with the same filters. Use Get Render for one render by ID.',
		idempotent: true,
	},
	props: {
		templateId: robollyAiProps.templateId({
			required: false,
			description: 'Only renders of this template. Use List Templates to find it.',
		}),
		movieId: Property.ShortText({
			displayName: 'Movie ID',
			description: 'Only renders with this movie ID.',
			required: false,
		}),
		cacheHash: Property.ShortText({
			displayName: 'Cache Hash',
			description: 'Only the render with this cache hash.',
			required: false,
		}),
		cursor: Property.ShortText({
			displayName: 'Cursor',
			description: 'paginationCursorNext from the previous page.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await robollyApi.listRenders({
			auth,
			templateId: propsValue.templateId,
			movieId: propsValue.movieId,
			cacheHash: propsValue.cacheHash,
			cursor: propsValue.cursor,
		});
	},
});
