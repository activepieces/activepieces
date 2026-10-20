import { DropdownState, Property } from '@activepieces/pieces-framework';

import { facebookLeadsAuth } from '../auth';
import { facebookLeadsApi } from './api';

import type { FacebookLeadsPageDropdown } from './types';

function page<R extends boolean>({ required, displayName = 'Page', description }: PropParams<R>) {
	return Property.Dropdown<FacebookLeadsPageDropdown, R, typeof facebookLeadsAuth>({
		auth: facebookLeadsAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Connect your Facebook account first.' });
			}
			try {
				const pages = await facebookLeadsApi.listPages({ accessToken: auth.access_token });
				if (pages.length === 0) {
					return { disabled: false, options: [], placeholder: 'No Pages found for this account.' };
				}
				return {
					disabled: false,
					options: pages.map((page) => ({
						label: page.name,
						value: { id: page.id, accessToken: page.access_token },
					})),
				};
			} catch (e) {
				return disabledOptions({ placeholder: "Couldn't load your Pages. Try reconnecting." });
			}
		},
	});
}

function form<R extends boolean>({ required, displayName = 'Form', description }: PropParams<R>) {
	return Property.Dropdown<string, R, typeof facebookLeadsAuth>({
		auth: facebookLeadsAuth,
		displayName,
		description,
		required,
		refreshers: ['page'],
		options: async ({ page }) => {
			if (!isPageDropdownValue(page)) {
				return disabledOptions({ placeholder: 'Select a Page first.' });
			}
			try {
				const forms = await facebookLeadsApi.listLeadForms({
					pageId: page.id,
					accessToken: page.accessToken,
					detailed: true,
				});
				return {
					disabled: false,
					options: [
						{ label: 'All Forms', value: 'all' },
						...forms.map((form) => ({
							label: formLabel({ name: form.name, status: form.status }),
							value: form.id,
						})),
					],
				};
			} catch (e) {
				return disabledOptions({
					placeholder: "Couldn't load forms. Check your access to this Page's lead ads.",
				});
			}
		},
	});
}

function isPageDropdownValue(value: unknown): value is FacebookLeadsPageDropdown {
	return (
		typeof value === 'object' &&
		value !== null &&
		'id' in value &&
		typeof value.id === 'string' &&
		'accessToken' in value &&
		typeof value.accessToken === 'string'
	);
}

function formLabel({ name, status }: { name: string; status: string | undefined }): string {
	if (!status || status === 'ACTIVE') {
		return name;
	}
	return `${name} (${titleCase({ text: status })})`;
}

function titleCase({ text }: { text: string }): string {
	return text
		.toLowerCase()
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
	return { disabled: true, options: [], placeholder };
}

export const facebookLeadsProps = { page, form };

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
