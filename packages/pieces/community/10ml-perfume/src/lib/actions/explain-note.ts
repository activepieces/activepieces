import { createAction, Property } from '@activepieces/pieces-framework';
import { apiGet } from '../common/client';
import { flattenNote } from '../common/flatten';
import { detailedProfiles, formatFor, language, rawResponse } from '../common/props';

export const explainNote = createAction({
	name: 'explain_note',
	classification: 'READ',
	displayName: 'Explain Note',
	description: 'Explain a fragrance note: what it smells like, what it pairs with, and which famous perfumes lead with it.',
	audience: 'both',
	aiMetadata: {
		description:
			'Explain one perfume note (for example oud, vetiver or tonka bean): its scent, mood, family, pairings, similar notes and famous perfumes. Use it to answer "what does X smell like". An unknown note does not fail: found is false. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		note: Property.ShortText({
			displayName: 'Note',
			description: "The note name. Example: 'oud', 'bergamot' or 'tonka bean'.",
			required: true,
		}),
		detailed: detailedProfiles,
		locale: language,
		raw: rawResponse,
	},
	async run({ propsValue: p }) {
		const { body } = await apiGet(`/notes/${encodeURIComponent(p.note.trim())}`, {
			format: formatFor(p.detailed),
			locale: p.locale,
		});
		return p.raw ? body : flattenNote(body);
	},
});
