import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskSearchAccountsOutputSchema } from '../../../output-schemas';

export const zohoDeskSearchAccountsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_search_accounts',
	outputSchema: zohoDeskSearchAccountsOutputSchema,
	displayName: 'Search Accounts',
	description: 'Searches accounts by text or name.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Searches accounts by free text (supports a trailing * wildcard), account name or time range. Page with From and Limit.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		searchText: Property.ShortText({
			displayName: 'Search Text',
			description: 'Free text matched across account fields; end with * for a prefix match.',
			required: false,
		}),
		accountName: Property.ShortText({
			displayName: 'Account Name',
			description: 'Account name.',
			required: false,
		}),
		createdTimeRange: Property.ShortText({
			displayName: 'Created Time Range',
			description:
				'Two ISO 8601 times separated by a comma, e.g. "2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.000Z".',
			required: false,
		}),
		modifiedTimeRange: Property.ShortText({
			displayName: 'Modified Time Range',
			description:
				'Two ISO 8601 times separated by a comma, e.g. "2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.000Z".',
			required: false,
		}),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			description: 'Sort order.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'relevance', value: 'relevance' },
					{ label: 'modifiedTime', value: 'modifiedTime' },
					{ label: 'createdTime', value: 'createdTime' },
					{ label: 'accountName', value: 'accountName' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const {
			orgId,
			searchText,
			accountName,
			createdTimeRange,
			modifiedTimeRange,
			sortBy,
			from,
			limit,
		} = context.propsValue;
		const accounts = await zohoDeskApi.searchAccounts({
			auth: context.auth,
			orgId,
			searchText,
			accountName,
			createdTimeRange,
			modifiedTimeRange,
			sortBy,
			from,
			limit,
		});
		return { accounts, count: accounts.length };
	},
});
