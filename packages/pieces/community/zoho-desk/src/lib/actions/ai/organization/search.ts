import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskSearchOutputSchema } from '../../../output-schemas';

export const zohoDeskSearchAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_search',
	outputSchema: zohoDeskSearchOutputSchema,
	displayName: 'Search',
	description: 'Searches tickets, contacts, accounts and other records in one query.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Searches across modules (tickets, contacts, accounts, tasks and more) with one text query and returns the matches with their module. Use the module-specific search actions for field filters.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		searchStr: Property.ShortText({
			displayName: 'Search Text',
			description: 'Text to search for.',
			required: true,
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			description: 'Sort order.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'relevance', value: 'relevance' },
					{ label: 'modifiedTime', value: 'modifiedTime' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, searchStr, departmentId, sortBy, from, limit } = context.propsValue;
		const results = await zohoDeskApi.search({
			auth: context.auth,
			orgId,
			searchStr,
			departmentId,
			sortBy,
			from,
			limit,
		});
		return { results, count: results.length };
	},
});
