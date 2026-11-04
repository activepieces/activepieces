import { createAction, Property } from '@activepieces/pieces-framework';
import { apiGet } from '../common/client';
import { flattenPerfumes } from '../common/flatten';
import {
	cursor, detailedProfiles, dropdownOptions, formatFor, GENDERS, house, language, limit, noteList,
	OCCASIONS, rawResponse, SEASONS, STYLES,
} from '../common/props';

export const searchPerfumes = createAction({
	name: 'search_perfumes',
	classification: 'SEARCH',
	displayName: 'Search Perfumes',
	description: 'Search the 10ML Fragrance Index by free text, house, notes, accords, family, audience, season, occasion or style.',
	audience: 'both',
	aiMetadata: {
		description:
			'Search 6,000+ perfumes by free text and filters (house, notes to include or exclude, accords, family, gender, season, occasion, style, iconic only). Use it to browse or shortlist; use Get Perfume for one known perfume and Find Similar Perfumes to find scents that smell like one. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		query: Property.ShortText({
			displayName: 'Search Text',
			description: "Free text, such as 'smoky vanilla' or 'Dior Sauvage'. Max 200 characters.",
			required: false,
		}),
		house: house('Only perfumes from this house. Example: Maison Francis Kurkdjian'),
		notesInclude: noteList('Must Have Notes', "Notes every result must contain. Example: 'oud', 'rose'."),
		notesExclude: noteList('Must Not Have Notes', "Notes no result may contain. Example: 'vanilla'."),
		accords: noteList('Accords', "Accords to match. Example: 'woody', 'amber'."),
		family: Property.ShortText({
			displayName: 'Fragrance Family',
			description: "Example: 'Amber floral' or 'Citrus aromatic'. Max 40 characters.",
			required: false,
		}),
		gender: Property.StaticDropdown({ displayName: 'Audience', required: false, options: dropdownOptions(GENDERS) }),
		season: Property.StaticDropdown({ displayName: 'Season', required: false, options: dropdownOptions(SEASONS) }),
		occasion: Property.StaticDropdown({ displayName: 'Occasion', required: false, options: dropdownOptions(OCCASIONS) }),
		style: Property.StaticDropdown({ displayName: 'Style', required: false, options: dropdownOptions(STYLES) }),
		iconicOnly: Property.Checkbox({
			displayName: 'Iconic Perfumes Only',
			description: 'Only well-known, widely loved perfumes.',
			required: false,
			defaultValue: false,
		}),
		limit: limit(20, 8),
		cursor,
		detailed: detailedProfiles,
		locale: language,
		raw: rawResponse,
	},
	async run({ propsValue: p }) {
		const { body } = await apiGet('/perfumes', {
			q: p.query,
			house: p.house,
			notes_include: p.notesInclude as string[] | undefined,
			notes_exclude: p.notesExclude as string[] | undefined,
			accords: p.accords as string[] | undefined,
			family: p.family,
			gender: p.gender,
			season: p.season,
			occasion: p.occasion,
			style: p.style,
			iconic: p.iconicOnly ? true : undefined,
			limit: p.limit,
			cursor: p.cursor,
			format: formatFor(p.detailed),
			locale: p.locale,
		});
		return p.raw ? body : flattenPerfumes(body['results']);
	},
});
