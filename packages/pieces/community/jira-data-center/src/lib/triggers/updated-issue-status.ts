import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { createJiraStatusPolling } from '../common/polling';
import { jiraSampleData } from '../common/sample-data';
import { jiraTriggerProps } from '../common/trigger-props';

const polling = createJiraStatusPolling();

export const updatedIssueStatus = createTrigger({
	name: 'updated_issue_status',
	classification: 'READ',
	displayName: 'Updated Issue Status',
	description: 'Triggers when an issue moves to another status.',
	aiMetadata: {
		description:
			"Fires when a Jira Data Center/Server issue moves to another status (for example To Do to In Progress), optionally limited to issues matching a JQL filter. Narrower than Updated Issue: other edits and newly created issues do not fire it. Each event is one issue with its current field data; several moves between two polls give one event. Polling-based; events arrive on the next poll, not instantly.",
	},
	auth: jiraDataCenterAuth,
	type: TriggerStrategy.POLLING,
	props: {
		filterHelp: jiraTriggerProps.filterHelp(),
		jql: jiraTriggerProps.issueFilter(),
	},
	propertyGroups: [
		{
			key: 'filter',
			display: 'section',
			label: 'Filter',
			icon: 'filter',
			props: ['filterHelp', 'jql'],
		},
	],
	sampleData: jiraSampleData.updatedIssueStatus,
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
