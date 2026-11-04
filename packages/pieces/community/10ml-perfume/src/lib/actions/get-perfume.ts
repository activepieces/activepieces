import { createAction, Property } from '@activepieces/pieces-framework';
import { apiGet } from '../common/client';
import { flattenGetPerfume } from '../common/flatten';
import { detailedProfiles, formatFor, house, language, rawResponse } from '../common/props';

export const getPerfume = createAction({
	name: 'get_perfume',
	classification: 'READ',
	displayName: 'Get Perfume',
	description: 'Get the profile of one perfume: note pyramid, accords, seasons, similar scents and alternatives.',
	audience: 'both',
	aiMetadata: {
		description:
			'Look up one perfume by name or id and return its profile (notes, accords, character, similar scents, alternatives, guides). Use it when the perfume is known; use Search Perfumes to browse. An unknown name does not fail: found is false and suggestions lists close spellings. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		perfume: Property.ShortText({
			displayName: 'Perfume',
			description: "Perfume name or id. Example: 'Baccarat Rouge 540' or 'maison-francis-kurkdjian-baccarat-rouge-540-edp'.",
			required: true,
		}),
		house: house('The house, when the name alone is ambiguous. Example: Maison Francis Kurkdjian'),
		detailed: detailedProfiles,
		locale: language,
		raw: rawResponse,
	},
	async run({ propsValue: p }) {
		const { body } = await apiGet(`/perfumes/${encodeURIComponent(p.perfume.trim())}`, {
			house: p.house,
			format: formatFor(p.detailed),
			locale: p.locale,
		});
		return p.raw ? body : flattenGetPerfume(body);
	},
});
