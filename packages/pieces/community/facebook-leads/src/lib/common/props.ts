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
				return disabledOptions({ placeholder: 'Connect your account first.' });
			}
			try {
				const pages = await facebookLeadsApi.listPages({ accessToken: auth.access_token });
				return {
					disabled: false,
					options: pages.map((page) => ({
						label: page.name,
						value: { id: page.id, accessToken: page.access_token },
					})),
				};
			} catch (e) {
				return disabledOptions({ placeholder: 'Error occured while fetching pages.' });
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
				return disabledOptions({ placeholder: 'Select page first.' });
			}
			try {
				const forms = await facebookLeadsApi.listLeadForms({
					pageId: page.id,
					accessToken: page.accessToken,
				});
				return {
					disabled: false,
					options: [
						{ label: 'All Forms (Default)', value: 'all' },
						...forms.map((form) => ({ label: form.name, value: form.id })),
					],
				};
			} catch (e) {
				return disabledOptions({ placeholder: 'Error occured while fetching forms.' });
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

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
	return { disabled: true, options: [], placeholder };
}

export const facebookLeadsProps = { page, form };

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
