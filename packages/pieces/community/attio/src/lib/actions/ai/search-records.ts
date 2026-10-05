import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioSearchRecordsOutputSchema } from '../../output-schemas';

export const attioSearchRecordsAction = createAction({
	auth: attioAuth,
	name: 'attio_search_records',
	outputSchema: attioSearchRecordsOutputSchema,
	displayName: 'Search Records',
	description: 'Fuzzy-searches records across objects by name, domain, email or phone.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Fuzzy-searches records by text (names, domains, emails, phone numbers) across the given objects. Results are eventually consistent and may miss very recent changes; use Query Records for exact filters. Returns record IDs for Get Record.',
		idempotent: true,
	},
	props: {
		query: Property.ShortText({
			displayName: 'Query',
			description: 'Text to search for. An empty string returns default results.',
			required: true,
		}),
		objects: Property.Array({
			displayName: 'Objects',
			description: 'Object slugs or IDs to search, e.g. `people`, `companies`.',
			required: true,
		}),
		limit: attioAi.limitProp({ max: 25 }),
	},
	async run(context) {
		const { query, objects, limit } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown>[] }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: '/objects/records/search',
			body: { query, objects: attioAi.strings(objects), limit: limit ?? 25, request_as: { type: 'workspace' } },
		});
		return { results: response.data, count: response.data.length };
	},
});
