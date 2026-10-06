import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickListProjectsOutputSchema } from '../../output-schemas';

export const listProjectsAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_list_projects',
	outputSchema: ticktickListProjectsOutputSchema,
	displayName: 'List Projects',
	description: 'Lists the TickTick projects (lists) of the connected account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the account\'s projects with their ids, names, view modes and group ids. Use first to resolve a project name to the projectId other actions need. The Inbox is not returned; task actions accept "inbox" as a projectId. Read-only.',
		idempotent: true,
	},
	props: {
		offset: Property.Number({
			displayName: 'Offset',
			description: 'Zero-based result offset. Omit to use the vendor default.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum number of projects to return. The vendor default is 200.',
			required: false,
		}),
	},
	async run(context) {
		const { offset, limit } = context.propsValue;
		const projects = await tickTickApiCall<Record<string, unknown>[]>({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: '/project',
			query: { offset, limit },
		});
		return { projects, count: projects.length };
	},
});
