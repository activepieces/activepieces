import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { songupAuth } from './auth';
import { songupApiCall } from './client';

export const languageDropdown = Property.Dropdown({
	auth: songupAuth,
	displayName: 'Language',
	description: 'Leave empty to sing in the language of the song idea.',
	required: false,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return { disabled: true, options: [], placeholder: 'Please connect your account first.' };
		}
		const response = await songupApiCall<{ languages: { name: string; native: string }[] }>({
			apiKey: auth.secret_text,
			method: HttpMethod.GET,
			path: '/languages',
		});
		return {
			disabled: false,
			options: response.languages.map((l) => ({
				label: l.native === l.name ? l.name : `${l.name} (${l.native})`,
				value: l.name,
			})),
		};
	},
});
