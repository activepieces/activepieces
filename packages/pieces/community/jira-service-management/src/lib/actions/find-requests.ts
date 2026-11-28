import { Property, createAction, isNil } from '@activepieces/pieces-framework';
import { jsmAuth, jsmConnection } from '../auth';
import { JsmAuthProps, jsmClient } from '../common/client';
import { jsmProps } from '../common/props';
import { jsmRequests } from '../common/requests';
import { requestListOutputSchema } from '../output-schemas';

export const findRequestsAction = createAction({
	auth: jsmAuth,
	name: 'find_requests',
	classification: 'SEARCH',
	displayName: 'Find Requests',
	description: 'Finds customer requests by service desk, text and status.',
	audience: 'both',
	aiMetadata: {
		description:
			'Search Jira Service Management customer requests, newest first, optionally limited to one service desk, a text match and open or closed status. Use to look requests up when you do not know the key; with a known key use Get Request. Returns at most Max Results requests. Read-only, safe to retry.',
		idempotent: true,
	},
	outputSchema: requestListOutputSchema,
	propertyGroups: [
		{
			key: 'filters',
			display: 'section',
			label: 'Filters',
			icon: 'filter',
			props: ['serviceDeskId', 'searchTerm', 'requestStatus'],
		},
	],
	props: {
		serviceDeskId: jsmProps.optionalServiceDesk({ description: 'Empty: every service desk is searched.' }),
		searchTerm: Property.ShortText({
			displayName: 'Search Text',
			description: 'Words to look for in the summary, description and comments.',
			placeholder: 'printer not working',
			required: false,
		}),
		requestStatus: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			defaultValue: 'all',
			display: 'cards',
			options: {
				options: [
					{ label: 'All', value: 'all', description: 'Any status', icon: 'filter' },
					{ label: 'Open', value: 'open', description: 'Not done yet', icon: 'inbox' },
					{ label: 'Closed', value: 'closed', description: 'Resolved', icon: 'tag' },
				],
			},
		}),
		maxResults: jsmProps.maxResults(),
	},
	async run(context) {
		const auth = jsmConnection.toProps(context.auth);
		const { serviceDeskId, searchTerm, requestStatus, maxResults } = context.propsValue;
		const scope = await projectScope({ auth, serviceDeskId });
		if (isNil(scope)) {
			return [];
		}
		const term = jsmClient.asString(searchTerm);
		const conditions = [
			scope,
			isNil(term) ? null : jsmRequests.textClause(term),
			STATUS_JQL[requestStatus ?? 'all'] ?? null,
		].filter((condition): condition is string => !isNil(condition));
		return jsmRequests.search({
			auth,
			jql: `${conditions.join(' AND ')} ORDER BY created DESC`,
			limit: jsmProps.resolveLimit(maxResults),
		});
	},
});

async function projectScope({ auth, serviceDeskId }: { auth: JsmAuthProps; serviceDeskId: string | undefined }): Promise<string | null> {
	const selected = jsmClient.asString(serviceDeskId);
	const desks = isNil(selected)
		? await jsmRequests.listServiceDesks({ auth })
		: [await jsmRequests.getServiceDesk({ auth, serviceDeskId: selected })];
	const projectIds = desks.map((desk) => desk.projectId).filter((id): id is string => !isNil(id) && /^\d+$/.test(id));
	return projectIds.length === 0 ? null : `project in (${projectIds.join(', ')})`;
}

const STATUS_JQL: Record<string, string | undefined> = {
	open: 'statusCategory != Done',
	closed: 'statusCategory = Done',
};
