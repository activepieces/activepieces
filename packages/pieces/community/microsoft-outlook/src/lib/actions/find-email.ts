import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';
import { microsoftOutlookAuth } from '../common/auth';

export const findEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'findEmail',
	displayName: 'Find Email',
	description: 'Searches for emails using full-text search.',
	props: {
		searchQuery: Property.ShortText({
			displayName: 'Search Query',
			description: 'Search terms to find emails (e.g., "from:john@example.com", "subject:urgent", "hasAttachments:true")',
			required: true,
		}),
		folderId: Property.Dropdown({
			displayName: 'Folder (Optional)',
			description: 'Search in a specific folder. Leave empty to search all folders.',
			required: false,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
					};
				}

				const client = Client.initWithMiddleware({
					authProvider: {
						getAccessToken: () => Promise.resolve((auth as OAuth2PropertyValue).access_token),
					},
				});

				try {
					const response: PageCollection = await client
						.api('/me/mailFolders')
						.get();

					const folders = response.value as any[];

					return {
						disabled: false,
						options: [
							{ label: 'All Folders', value: '' },
							...folders.map((folder) => ({
								label: folder.displayName || folder.id || 'Unknown',
								value: folder.id || '',
							})),
						],
					};
				} catch (error) {
					return {
						disabled: true,
						options: [],
					};
				}
			},
		}),
		top: Property.Number({
			displayName: 'Max Results',
			description: 'Maximum number of results to return (1-1000).',
			required: false,
			defaultValue: 25,
		}),
		select: Property.Array({
			displayName: 'Select Fields',
			description: 'Specific fields to return in the results.',
			required: false,
			defaultValue: ['id', 'subject', 'from', 'toRecipients', 'receivedDateTime'],
		}),
	},
	async run(context) {
		const { searchQuery, folderId, top, select } = context.propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		const baseUrl = folderId ? `/me/mailFolders/${folderId}/messages` : '/me/messages';
		const searchParam = `$search="${searchQuery}"`;
		const topParam = top ? `$top=${Math.min(Math.max(top, 1), 1000)}` : '$top=25';
		const selectParam = select && select.length > 0 ? `$select=${select.join(',')}` : '';

		const queryParams = [searchParam, topParam, selectParam].filter(Boolean).join('&');
		const url = `${baseUrl}?${queryParams}`;

		const headers: Record<string, string> = {
			'ConsistencyLevel': 'eventual',
			'Prefer': 'outlook.body-content-type="text"',
		};

		const response: PageCollection = await client
			.api(url)
			.headers(headers)
			.get();

		let messages = response.value as Message[];
		const nextPageUrl = response['@odata.nextLink'];

		if (searchQuery) {
			messages.sort((a, b) => dayjs(b.receivedDateTime).valueOf() - dayjs(a.receivedDateTime).valueOf());
		}

		return {
			success: true,
			message: `Found ${messages.length} emails.`,
			emails: messages,
			hasMore: !!nextPageUrl,
			nextPageUrl: nextPageUrl,
			totalCount: messages.length,
		};
	},
});
