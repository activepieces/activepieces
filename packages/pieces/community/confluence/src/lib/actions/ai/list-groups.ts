import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceApi } from '../../common/api';
import { confluenceListGroupsOutputSchema } from '../../output-schemas';

export const listGroupsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_groups',
	outputSchema: confluenceListGroupsOutputSchema,
	displayName: 'List Groups',
	description: 'Lists the user groups on the site.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the user groups on the Confluence site with their IDs and names. Use the group ID with List Group Members. Page with Start and Limit.',
		idempotent: true,
	},
	props: {
		start: Property.Number({
			displayName: 'Start',
			description: 'Offset of the first item (0-based). Defaults to 0.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum number of items to return. Defaults to 25.',
			required: false,
		}),
	},
	async run(context) {
		const { start, limit } = context.propsValue;
		return await confluenceApi.listGroups({
			auth: context.auth,
			query: { start, limit: limit ?? 25 },
		});
	},
});
