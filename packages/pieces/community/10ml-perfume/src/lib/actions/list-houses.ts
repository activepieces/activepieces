import { createAction, Property } from '@activepieces/pieces-framework';
import { apiGet } from '../common/client';
import { flattenHouse } from '../common/flatten';
import { isRecord } from '../common/client';
import { cursor, dropdownOptions, HOUSE_TYPES, language, limit, rawResponse } from '../common/props';

export const listHouses = createAction({
	name: 'list_houses',
	classification: 'SEARCH',
	displayName: 'List Houses',
	description: 'Browse perfume houses by type, country or name.',
	audience: 'both',
	aiMetadata: {
		description:
			'List perfume houses (brands), filtered by type (designer, niche, middle-eastern, indie, celebrity), country or a name fragment. Use Get House for the full profile of one house. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		type: Property.StaticDropdown({ displayName: 'Type', required: false, options: dropdownOptions(HOUSE_TYPES) }),
		country: Property.ShortText({
			displayName: 'Country',
			description: "Example: 'France' or 'Italy'. Max 40 characters.",
			required: false,
		}),
		name: Property.ShortText({
			displayName: 'Name Contains',
			description: "Part of the house name. Example: 'dior'.",
			required: false,
		}),
		limit: limit(50, 20),
		cursor,
		locale: language,
		raw: rawResponse,
	},
	async run({ propsValue: p }) {
		const { body } = await apiGet('/houses', {
			type: p.type,
			country: p.country,
			query: p.name,
			limit: p.limit,
			cursor: p.cursor,
			locale: p.locale,
		});
		if (p.raw) return body;
		const houses = Array.isArray(body['houses']) ? body['houses'].filter(isRecord) : [];
		return houses.map(flattenHouse);
	},
});
