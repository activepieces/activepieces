import { DropdownState, Property } from '@activepieces/pieces-framework';

import { googleTranslateAuth } from '../auth';
import { googleTranslateApi } from './api';

function language<R extends boolean>({
	required,
	displayName = 'Language',
	description = 'A language supported by Google Translate.',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: googleTranslateAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({
					placeholder: 'Please select an existing or create a new connection.',
				});
			}
			try {
				const languages = await googleTranslateApi.listLanguages({ auth, target: 'en' });
				const options = languages
					.filter((language) => !LEGACY_LANGUAGE_CODES.has(language.language))
					.map((language) => ({
						label: language.name ? `${language.name} (${language.language})` : language.language,
						value: language.language,
					}))
					.sort((a, b) => a.label.localeCompare(b.label));
				return { disabled: false, options };
			} catch {
				return disabledOptions({
					placeholder: 'An error occurred while fetching the supported languages.',
				});
			}
		},
	});
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
	return { disabled: true, options: [], placeholder };
}

export const googleTranslateProps = { language };

const LEGACY_LANGUAGE_CODES = new Set(['iw', 'jw']);

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
