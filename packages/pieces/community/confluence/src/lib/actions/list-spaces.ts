import { createAction, Property } from '@activepieces/pieces-framework';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { listSpacesOutputSchema } from '../output-schemas';

export const listSpacesAction = createAction({
	auth: confluenceAuth,
	name: 'list-spaces',
	outputSchema: listSpacesOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Spaces',
	description: 'Lists all spaces the authenticated user can access.',
	audience: 'human',
	aiMetadata: { description: 'Lists the Confluence spaces the authenticated user can access (paginated through all results), optionally filtered by space type (global, personal, collaboration, knowledge base) and status (current or archived). Use to discover available spaces or resolve a space to its ID. Read-only and idempotent.', idempotent: true },
	props: {
		type: Property.StaticDropdown({
			displayName: 'Type',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Global', value: 'global' },
					{ label: 'Personal', value: 'personal' },
					{ label: 'Collaboration', value: 'collaboration' },
					{ label: 'Knowledge Base', value: 'knowledge_base' },
				],
			},
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			defaultValue: 'current',
			options: {
				disabled: false,
				options: [
					{ label: 'Current', value: 'current' },
					{ label: 'Archived', value: 'archived' },
				],
			},
		}),
	},
	async run(context) {
		const { type, status } = context.propsValue;

		const query: Record<string, string> = {};
		if (type) query['type'] = type;
		if (status) query['status'] = status;

		const spaces = await confluenceApi.listSpaces({ auth: context.auth, query });

		return { count: spaces.length, results: spaces };
	},
});
