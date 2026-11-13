import { createAction, Property } from '@activepieces/pieces-framework';

import { googleTranslateAuth } from '../auth';
import { googleTranslateApi } from '../common/api';
import { googleTranslateProps } from '../common/props';
import { translateTextOutputSchema } from '../output-schemas';

import type { GoogleTranslateFormat } from '../common/types';

export const translateTextAction = createAction({
	name: 'translateText',
	classification: 'READ',
	displayName: 'Translate Text',
	description: 'Translate text into a target language with Google Cloud Translation',
	audience: 'both',
	aiMetadata: {
		description:
			'Translates a text into a target language code (e.g. pt, es) with Google Cloud Translation and returns the translated text and the source language. Leave the source language empty to auto-detect it; set format to html to keep markup intact. Changes nothing in Google, safe to retry, but every call is billed per character on the connected Google Cloud project.',
		idempotent: true,
	},
	outputSchema: translateTextOutputSchema,
	auth: googleTranslateAuth,
	props: {
		text: Property.LongText({
			displayName: 'Text',
			description: 'Text to translate. Pick HTML in Format to keep markup intact.',
			required: true,
		}),
		targetLanguage: googleTranslateProps.language({
			required: true,
			displayName: 'Target Language',
			description: 'Language to translate into.',
		}),
		sourceLanguage: googleTranslateProps.language({
			required: false,
			displayName: 'Source Language',
			description: 'Leave empty to let Google detect the language of the text.',
		}),
		format: Property.StaticDropdown<GoogleTranslateFormat>({
			displayName: 'Format',
			description: 'How the text should be parsed.',
			required: false,
			defaultValue: 'text',
			options: {
				options: [
					{ label: 'Plain text', value: 'text' },
					{ label: 'HTML', value: 'html' },
				],
			},
		}),
	},
	async run(context) {
		const { text, targetLanguage, sourceLanguage, format } = context.propsValue;

		const translations = await googleTranslateApi.translate({
			auth: context.auth,
			q: text,
			target: targetLanguage,
			source: sourceLanguage || undefined,
			format: format ?? 'text',
		});

		const [translation] = translations;
		if (!translation) {
			throw new Error('Google Translate returned no translation for the given text.');
		}

		return {
			translatedText: translation.translatedText,
			detectedSourceLanguage: translation.detectedSourceLanguage ?? sourceLanguage ?? null,
			targetLanguage,
		};
	},
});
