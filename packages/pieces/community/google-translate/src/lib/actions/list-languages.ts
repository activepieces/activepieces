import { createAction, Property } from '@activepieces/pieces-framework';

import { googleTranslateAuth } from '../auth';
import { googleTranslateApi } from '../common/api';
import { listLanguagesOutputSchema } from '../output-schemas';

export const listLanguagesAction = createAction({
	name: 'listLanguages',
	classification: 'SEARCH',
	displayName: 'List Supported Languages',
	description: 'List the languages Google Cloud Translation supports, with their names',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists every language code Google Cloud Translation supports, with names rendered in a chosen display language. Use to validate or look up a language code before translating. Read only, safe to retry.',
		idempotent: true,
	},
	outputSchema: listLanguagesOutputSchema,
	auth: googleTranslateAuth,
	props: {
		displayLanguage: Property.ShortText({
			displayName: 'Display Language',
			description: 'ISO-639-1 code used to render the language names (e.g. en, pt, es).',
			required: false,
			defaultValue: 'en',
		}),
	},
	async run(context) {
		const languages = await googleTranslateApi.listLanguages({
			auth: context.auth,
			target: context.propsValue.displayLanguage || 'en',
		});

		return { languages };
	},
});
