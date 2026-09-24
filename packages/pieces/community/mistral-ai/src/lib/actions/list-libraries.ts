import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { libraryUtils, MistralLibrary } from '../common/libraries';
import { listLibrariesOutputSchema } from '../output-schemas';

export const listLibraries = createAction({
	auth: mistralAuth,
	name: 'list_libraries',
	classification: 'SEARCH',
	displayName: 'List Libraries',
	description: 'List document libraries you can access (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists Mistral document libraries (Beta) with their UUIDs, names, document counts and sizes, optionally filtered by a name search, one page at a time. Use it to find a library id for the document actions or for an agent’s document library tool. Pass the returned next page token to get the next page. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: listLibrariesOutputSchema,
	props: {
		search: Property.ShortText({
			displayName: 'Search',
			description: 'Only return libraries whose name contains this text.',
			required: false,
		}),
		page_size: Property.Number({ displayName: 'Page Size', required: false, defaultValue: 100 }),
		page_token: Property.ShortText({
			displayName: 'Page Token',
			description: 'The next page token from a previous call.',
			required: false,
		}),
	},
	async run(context) {
		const { search, page_size, page_token } = context.propsValue;
		const response = await mistralApi.call<{ data: MistralLibrary[]; next_page_token?: string | null }>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: '/libraries',
			queryParams: { search, page_size, page_token },
		});
		const libraries = response.data.map(libraryUtils.formatLibrary);
		return {
			libraries,
			count: libraries.length,
			next_page_token: response.next_page_token ?? null,
		};
	},
});
