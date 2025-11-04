import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const templateIdDropdown = Property.Dropdown({
	displayName: 'Template ID',
	required: true,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account first.',
			};
		}

		try {
			let page = 1;
			let hasMore = true;

			const options: DropdownOption<string>[] = [];

			do {
				const response = await makeRequest<{
					document_template_cards: Array<{ id: string; identifier: string }>;
					meta: { total_pages: number; current_page: number };
				}>(auth as string, HttpMethod.GET, '/document_template_cards',{ page: page.toString() });

				const items = response.document_template_cards ?? [];

				for (const template of items) {
					options.push({ label: template.identifier, value: template.id });
				}

				page++;
				hasMore = response.meta.current_page < response.meta.total_pages;
			} while (hasMore);

			return {
				disabled: false,
				options,
			};
		} catch (error) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Error loading document templates.',
			};
		}
	},
});

export const documentIdDropdown = Property.Dropdown({
	displayName: 'Document ID',
	required: true,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account first.',
			};
		}

		try {
			let page = 1;
			let hasMore = true;

			const options: DropdownOption<string>[] = [];

			do {
				const response = await makeRequest<{
					document_cards: Array<{ id: string; filename: string }>;
					meta: { total_pages: number; current_page: number };
				}>(auth as string, HttpMethod.GET, '/document_cards', { page: page.toString() });

				const items = response.document_cards ?? [];

				for (const doc of items) {
					options.push({ label: doc.filename, value: doc.id });
				}
				page++;
				hasMore = response.meta.current_page < response.meta.total_pages;
			} while (hasMore);

			return {
				disabled: false,
				options,
			};
		} catch (error) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Error loading documents.',
			};
		}
	},
});
