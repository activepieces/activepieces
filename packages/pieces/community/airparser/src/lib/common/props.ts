import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { airparserApiCall } from './index';
import { airparserAuth } from '../..';

export const inboxIdDropdown = Property.Dropdown<string,true,typeof airparserAuth>({
	auth: airparserAuth,
	displayName: 'Inbox',
	required: true,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Please connect your Airparser account.',
				options: [],
			};
		}
		const response = await airparserApiCall<{ _id: string; name: string }[]>({
			apiKey: auth.secret_text,
			resourceUri: '/inboxes',
			method: HttpMethod.GET,
		});

		return {
			disabled: false,
			options: response.map((inbox) => ({
				label: inbox.name,
				value: inbox._id,
			})),
		};
	},
});

export const documentIdDropdown = Property.Dropdown<string,true,typeof airparserAuth>({
	auth: airparserAuth,
	displayName: 'Document',
	required: true,
	refreshers: ['inboxId'],
	options: async ({ auth, inboxId }) => {
		if (!auth || !inboxId) {
			return {
				disabled: true,
				placeholder: 'Select an inbox first.',
				options: [],
			};
		}

		let hasMore = true;
		let page = 1;

		const docs = [];

		do {
			const response = await airparserApiCall<{
				hasPrevPage: boolean;
				hasNextPage: boolean;
				docs: { _id: string; name: string }[];
			}>({
				apiKey: auth.secret_text,
				method: HttpMethod.GET,
				resourceUri: `/inboxes/${inboxId}/docs`,
				query: {
					page,
				},
			});

			if (!isNil(response.docs)) docs.push(...response.docs);
			hasMore = response.hasNextPage;
			page++;
		} while (hasMore);

		return {
			disabled: false,
			options: docs.map((doc) => ({ label: doc.name, value: doc._id })),
		};
	},
});
