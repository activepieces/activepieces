import { createAction, Property } from '@activepieces/pieces-framework';
import { apiGet, isRecord } from '../common/client';
import { flattenGuide } from '../common/flatten';
import { cursor, dropdownOptions, GUIDE_TYPES, language, limit, rawResponse } from '../common/props';

export const searchGuides = createAction({
	name: 'search_guides',
	classification: 'SEARCH',
	displayName: 'Search Guides',
	description: 'Search 10ML perfume guides and articles by topic or guide type (how-to, lists, notes, houses), in seventeen languages.',
	audience: 'both',
	aiMetadata: {
		description:
			'Search the 10ML perfume guides (how-to, lists, alternatives, notes, houses) by topic and return titles and links in the chosen language. Use it to find an article to read or cite. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		query: Property.ShortText({
			displayName: 'Search Text',
			description: "Topic words. Example: 'oud' or 'summer perfumes for men'. Max 120 characters.",
			required: false,
		}),
		type: Property.StaticDropdown({ displayName: 'Guide Type', required: false, options: dropdownOptions(GUIDE_TYPES) }),
		limit: limit(20, 8),
		cursor,
		locale: language,
		raw: rawResponse,
	},
	async run({ propsValue: p }) {
		const { body } = await apiGet('/guides', {
			q: p.query,
			type: p.type,
			limit: p.limit,
			cursor: p.cursor,
			locale: p.locale,
		});
		if (p.raw) return body;
		const guides = Array.isArray(body['guides']) ? body['guides'].filter(isRecord) : [];
		return guides.map(flattenGuide);
	},
});
