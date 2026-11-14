import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { createJiraPolling } from '../common/polling';
import { jiraSampleData } from '../common/sample-data';
import { jiraTriggerFilter } from '../common/trigger-props';

const polling = createJiraPolling();

export const updatedIssue = createTrigger({
	name: 'updated_issue',
	classification: 'READ',
	displayName: 'Updated Issue',
	description: 'Triggers when an issue is updated.',
	aiMetadata: {
		description:
			'Fires when any field of a Jira Data Center/Server issue is updated (status, assignee, summary, a new comment, etc.), optionally limited to issues matching a JQL filter. Each event is one updated issue with its current field data; it does not include a diff of what changed. Polling-based; events arrive on the next poll, not instantly.',
	},
	auth: jiraDataCenterAuth,
	type: TriggerStrategy.POLLING,
	props: jiraTriggerFilter.props,
	propertyGroups: jiraTriggerFilter.propertyGroups,
	sampleData: jiraSampleData.updatedIssue,
	async onEnable(context) {
		await polling.onEnable({ context });
	},
	async onDisable() {
		return;
	},
	async run(context) {
		return await polling.poll({ context });
	},
	async test(context) {
		return await polling.test({ context });
	},
});
