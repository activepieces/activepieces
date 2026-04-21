import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/shared';

import { tallyAuth } from '../auth';
import { tallyApiClient } from './client';

export const formsDropdown = Property.Dropdown<string, true, typeof tallyAuth>({
	auth: tallyAuth,
	displayName: 'Form',
	required: true,
	refreshers: [],
	async options({ auth }) {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Connect your account first',
				options: [],
			};
		}

		const { data: forms, error } = await tryCatch(() => tallyApiClient.listForms(auth.secret_text));

		if (error) {
			return {
				disabled: true,
				placeholder: 'Failed to load forms — check your connection',
				options: [],
			};
		}

		const options: DropdownOption<string>[] = forms.map((form) => ({
			label: form.name,
			value: form.id,
		}));

		return { disabled: false, placeholder: 'Select a form', options };
	},
});
