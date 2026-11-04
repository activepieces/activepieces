import { createAction, Property } from '@activepieces/pieces-framework';
import { apiGet } from '../common/client';
import { flattenGetHouse } from '../common/flatten';
import { detailedProfiles, formatFor, language, rawResponse } from '../common/props';

export const getHouse = createAction({
	name: 'get_house',
	classification: 'READ',
	displayName: 'Get House',
	description: 'Get a perfume house: country, style, what it is known for and its signature perfumes.',
	audience: 'both',
	aiMetadata: {
		description:
			'Look up one perfume house (brand) by name or id and return its country, type, founding year, style, best-known perfumes and signature perfumes. Use List Houses to browse houses. An unknown house does not fail: found is false. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		house: Property.ShortText({
			displayName: 'House',
			description: "The house name or id. Example: 'Tom Ford' or 'tom-ford'.",
			required: true,
		}),
		detailed: detailedProfiles,
		locale: language,
		raw: rawResponse,
	},
	async run({ propsValue: p }) {
		const { body } = await apiGet(`/houses/${encodeURIComponent(p.house.trim())}`, {
			format: formatFor(p.detailed),
			locale: p.locale,
		});
		return p.raw ? body : flattenGetHouse(body);
	},
});
