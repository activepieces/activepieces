import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { doctlyAuth } from '../../auth';
import { doctlyClient } from '../../common/client';
import { doctlyListExtractorsOutputSchema } from '../../output-schemas';

export const listExtractorsAction = createAction({
	auth: doctlyAuth,
	name: 'doctly_list_extractors',
	outputSchema: doctlyListExtractorsOutputSchema,
	displayName: 'List Extractors',
	description: 'Lists the extractors available in the account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the account\'s active extractors with their id, slug, name, cost and whether they can be edited or deleted. Returns one page and the total count; pass skip to read the next page. Run Extractor takes the slug; the other extractor actions take the id.',
		idempotent: true,
	},
	props: {
		limit: Property.Number({ displayName: 'Limit', description: 'Max extractors to return (1-100). Defaults to 50.', required: false }),
		skip: Property.Number({ displayName: 'Skip', description: 'How many extractors to skip, for paging. Defaults to 0.', required: false }),
	},
	async run(context) {
		const { limit, skip } = context.propsValue;
		return await doctlyClient.request({
			auth: context.auth,
			method: HttpMethod.GET,
			path: '/e',
			query: {
				limit: String(Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT)),
				skip: skip === undefined ? undefined : String(skip),
			},
		});
	},
});

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
