import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { intercomRequest } from '../common';
import { listTeamsOutputSchema } from '../output-schemas';

export const listTeamsAction = createAction({
	auth: intercomAuth,
	name: 'list_teams',
	classification: 'SEARCH',
	displayName: 'List Teams',
	description: 'Lists the teams in the workspace.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the teams with ID, name and member admin IDs. Use to find a team ID before assigning a conversation to a team. Read-only.',
		idempotent: true,
	},
	props: {},
	outputSchema: listTeamsOutputSchema,
	async run(context) {
		const body = await intercomRequest<{ teams?: Array<Record<string, unknown>> }>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: ['teams'],
			operation: 'list teams',
		});
		return {
			items: (body.teams ?? []).map((team) => ({
				id: team['id'],
				name: team['name'] ?? null,
				admin_ids: Array.isArray(team['admin_ids']) ? team['admin_ids'] : [],
			})),
		};
	},
});
