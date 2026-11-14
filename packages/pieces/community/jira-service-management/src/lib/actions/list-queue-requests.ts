import { createAction } from '@activepieces/pieces-framework';
import { jsmAuth, jsmConnection } from '../auth';
import { JiraIssue, jsmClient } from '../common/client';
import { jsmProps } from '../common/props';
import { jsmRequests } from '../common/requests';
import { requestListOutputSchema } from '../output-schemas';

export const listQueueRequestsAction = createAction({
	auth: jsmAuth,
	name: 'list_queue_requests',
	classification: 'SEARCH',
	displayName: 'List Queue Requests',
	description: 'Lists the requests that sit in one of your service desk queues.',
	audience: 'both',
	aiMetadata: {
		description:
			'List the requests currently in a Jira Service Management agent queue (for example "All open" or "Unassigned issues"), in the queue\'s own order. Use to work through what agents see; to search by text or status use Find Requests. Returns at most Max Results requests. Read-only, safe to retry.',
		idempotent: true,
	},
	outputSchema: requestListOutputSchema,
	propertyGroups: [
		{
			key: 'queue',
			display: 'section',
			label: 'Queue',
			icon: 'inbox',
			props: ['serviceDeskId', 'queueId'],
		},
	],
	props: {
		serviceDeskId: jsmProps.serviceDesk(),
		queueId: jsmProps.queue(),
		maxResults: jsmProps.maxResults(),
	},
	async run(context) {
		const auth = jsmConnection.toProps(context.auth);
		const { serviceDeskId, queueId, maxResults } = context.propsValue;
		const issues = await jsmClient.paginate<JiraIssue>({
			auth,
			path: `/servicedesk/${encodeURIComponent(serviceDeskId)}/queue/${encodeURIComponent(queueId)}/issue`,
			limit: jsmProps.resolveLimit(maxResults),
		});
		return jsmRequests.fetchMany({ auth, issues });
	},
});
