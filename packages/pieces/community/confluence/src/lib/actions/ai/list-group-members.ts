import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceApi } from '../../common/api';
import { confluenceListGroupMembersOutputSchema } from '../../output-schemas';

export const listGroupMembersAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_group_members',
	outputSchema: confluenceListGroupMembersOutputSchema,
	displayName: 'List Group Members',
	description: 'Lists the members of a group.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the users in a Confluence group with their account IDs and names. Get the group ID from List Groups. Page with Start and Limit.',
		idempotent: true,
	},
	props: {
		groupId: Property.ShortText({
			displayName: 'Group ID',
			description: 'Group ID, from List Groups.',
			required: true,
		}),
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
		const { groupId, start, limit } = context.propsValue;
		return await confluenceApi.listGroupMembers({
			auth: context.auth,
			groupId,
			query: { start, limit: limit ?? 25 },
		});
	},
});
