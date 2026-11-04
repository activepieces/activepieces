import { createAction, Property } from '@activepieces/pieces-framework';
import { apiGet } from '../common/client';
import { flattenSimilar } from '../common/flatten';
import { isRecord } from '../common/client';
import {
	cursor, detailedProfiles, dropdownOptions, formatFor, GENDERS, house, language, limit, noteList,
	rawResponse, STEERS,
} from '../common/props';

export const findSimilarPerfumes = createAction({
	name: 'find_similar_perfumes',
	classification: 'SEARCH',
	displayName: 'Find Similar Perfumes',
	description: 'Find perfumes that smell like one you name, or like a list of notes and accords. Steer the result fresher, sweeter or darker.',
	audience: 'both',
	aiMetadata: {
		description:
			'Rank perfumes by how closely they smell like a named perfume or like a list of notes and accords, with the shared notes and a closeness label. Give a perfume name, or notes/accords (works for scents not in the index). Use Find Alternatives for the editors\' curated picks to a famous perfume. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		perfume: Property.ShortText({
			displayName: 'Perfume',
			description: "The perfume to match. Example: 'Dior Sauvage'. Leave empty to match on notes or accords instead.",
			required: false,
		}),
		house: house('The perfume\'s house, when the name alone is ambiguous. Example: Dior'),
		notes: noteList('Notes', "Notes to match when no perfume is given. Example: 'saffron', 'cedar'."),
		accords: noteList('Accords', "Accords to match. Example: 'woody', 'amber'."),
		steer: Property.StaticDropdown({
			displayName: 'Steer',
			description: 'Nudge the matches in a direction.',
			required: false,
			options: {
				options: STEERS.map((value) => ({
					label: value.replace('_', ' ').replace(/^./, (c) => c.toUpperCase()),
					value,
				})),
			},
		}),
		gender: Property.StaticDropdown({ displayName: 'Audience', required: false, options: dropdownOptions(GENDERS) }),
		otherHousesOnly: Property.Checkbox({
			displayName: 'Other Houses Only',
			description: "Leave out perfumes from the named perfume's own house.",
			required: false,
			defaultValue: false,
		}),
		limit: limit(15, 8),
		cursor,
		detailed: detailedProfiles,
		locale: language,
		raw: rawResponse,
	},
	async run({ propsValue: p }) {
		const notes = p.notes as string[] | undefined;
		const accords = p.accords as string[] | undefined;
		if (!p.perfume?.trim() && !notes?.length && !accords?.length) {
			throw new Error('Give a perfume, or at least one note or accord, to find similar perfumes.');
		}
		const { body } = await apiGet('/similar', {
			perfume: p.perfume?.trim(),
			house: p.house,
			notes,
			accords,
			steer: p.steer,
			gender: p.gender,
			other_houses_only: p.otherHousesOnly ? true : undefined,
			limit: p.limit,
			cursor: p.cursor,
			format: formatFor(p.detailed),
			locale: p.locale,
		});
		if (p.raw) return body;
		const results = Array.isArray(body['results']) ? body['results'].filter(isRecord) : [];
		return results.map(flattenSimilar);
	},
});
