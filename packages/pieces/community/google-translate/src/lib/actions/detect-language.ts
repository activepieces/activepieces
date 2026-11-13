import { createAction, Property } from '@activepieces/pieces-framework';

import { googleTranslateAuth } from '../auth';
import { googleTranslateApi } from '../common/api';
import { detectLanguageOutputSchema } from '../output-schemas';

export const detectLanguageAction = createAction({
	name: 'detectLanguage',
	classification: 'READ',
	displayName: 'Detect Language',
	description: 'Detect the language of a text with Google Cloud Translation',
	audience: 'both',
	aiMetadata: {
		description:
			"Detects the language of a text and returns Google's top guess as a language code, its English name and a 0 to 1 confidence. Use before branching on language; to translate, call Translate text directly since it detects the source on its own. Read only, safe to retry.",
		idempotent: true,
	},
	outputSchema: detectLanguageOutputSchema,
	auth: googleTranslateAuth,
	props: {
		text: Property.LongText({
			displayName: 'Text',
			description: 'Text whose language should be detected.',
			required: true,
		}),
	},
	async run(context) {
		const [[detection], languages] = await Promise.all([
			googleTranslateApi.detect({
				auth: context.auth,
				q: context.propsValue.text,
			}),
			googleTranslateApi.listLanguages({ auth: context.auth, target: 'en' }),
		]);

		if (!detection) {
			throw new Error('Google Translate could not detect a language for the given text.');
		}

		return {
			language: detection.language,
			languageName: languages.find((language) => language.language === detection.language)?.name ?? null,
			confidence: detection.confidence ?? null,
		};
	},
});
