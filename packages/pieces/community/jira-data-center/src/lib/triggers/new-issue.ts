import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { createJiraPolling } from '../common/polling';
import { jiraSampleData } from '../common/sample-data';
import { jiraTriggerFilter } from '../common/trigger-props';

const polling = createJiraPolling({ timeField: 'created' });

export const newIssue = createTrigger({
	name: 'new_issue',
	classification: 'READ',
	displayName: 'New Issue',
	description: 'Triggers when a new issue is created.',
	aiMetadata: {
		description:
			'Fires when a new issue is created in Jira Data Center/Server, optionally limited to issues matching a JQL filter. Each event is one newly created issue with its full field data (summary, project, type, status, reporter, etc.). Polling-based; events arrive on the next poll, not instantly.',
	},
	auth: jiraDataCenterAuth,
	type: TriggerStrategy.POLLING,
	props: jiraTriggerFilter.props,
	propertyGroups: jiraTriggerFilter.propertyGroups,
	sampleData: jiraSampleData.newIssue,
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
