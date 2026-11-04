import { createAction, Property } from '@activepieces/pieces-framework';
import { apiGet, isRecord } from '../common/client';
import { flattenAlternative } from '../common/flatten';
import { cursor, dropdownOptions, CLOSENESS, house, language, limit, rawResponse } from '../common/props';

export const findPerfumeAlternatives = createAction({
	name: 'find_perfume_alternatives',
	classification: 'SEARCH',
	displayName: 'Find Perfume Alternatives',
	description: "Get the editors' curated alternatives to a famous perfume, from other houses, with how close each one is.",
	audience: 'both',
	aiMetadata: {
		description:
			"Return the 10ML editors' hand-picked alternatives to a famous (iconic) perfume, each with a closeness label (very close, similar vibe, same spirit) and a one-line reason. Only iconic originals have curated alternatives; for any other perfume use Find Similar Perfumes. Read-only, safe to retry.",
		idempotent: true,
	},
	props: {
		perfume: Property.ShortText({
			displayName: 'Perfume',
			description: "The famous perfume to find alternatives to. Example: 'Creed Aventus'.",
			required: true,
		}),
		house: house('The perfume\'s house, when the name alone is ambiguous. Example: Creed'),
		closeness: Property.StaticDropdown({
			displayName: 'Closeness',
			description: 'Only alternatives at this level of closeness.',
			required: false,
			options: dropdownOptions(CLOSENESS),
		}),
		limit: limit(10, 6),
		cursor,
		locale: language,
		raw: rawResponse,
	},
	async run({ propsValue: p }) {
		const { body } = await apiGet('/alternatives', {
			perfume: p.perfume.trim(),
			house: p.house,
			closeness: p.closeness,
			limit: p.limit,
			cursor: p.cursor,
			locale: p.locale,
		});
		if (p.raw) return body;
		const original = isRecord(body['original']) && typeof body['original']['name'] === 'string'
			? body['original']['name']
			: null;
		const alternatives = Array.isArray(body['alternatives']) ? body['alternatives'].filter(isRecord) : [];
		return alternatives.map((a) => flattenAlternative(a, original));
	},
});
