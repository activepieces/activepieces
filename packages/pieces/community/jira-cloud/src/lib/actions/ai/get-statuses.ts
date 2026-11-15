import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';

import { statusesOutputSchema } from '../../output-schemas';
export const getStatusesAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_statuses',
	classification: 'SEARCH',
	displayName: 'Get Statuses',
	description: 'Lists the issue statuses used in active workflows.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the issue statuses used in active workflows, with their IDs, names and status category (To Do, In Progress, Done). Use it to write valid status names in JQL; to move an issue to a status use Get Issue Transitions, since statuses cannot be set directly. Read-only.',
		idempotent: true,
	},
	outputSchema: statusesOutputSchema,
	props: {
		nameContains: Property.ShortText({
			displayName: 'Name Contains',
			description: 'Only return statuses whose name contains this text (case-insensitive).',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const statuses = await jiraApiCall<JiraRecord[]>({
			auth,
			method: HttpMethod.GET,
			resourceUri: '/status',
		});
		const needle = propsValue.nameContains?.trim().toLowerCase() ?? '';
		const items = needle.length === 0 ? statuses : statuses.filter((status) => String(status['name'] ?? '').toLowerCase().includes(needle));
		return jiraAiHelpers.toList({ items });
	},
});
