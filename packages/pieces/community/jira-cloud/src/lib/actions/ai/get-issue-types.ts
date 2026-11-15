import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JiraAuth, jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { issueTypesOutputSchema } from '../../output-schemas';
export const getIssueTypesAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_issue_types',
	classification: 'SEARCH',
	displayName: 'Get Issue Types',
	description: 'Lists the issue types available in a project.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the issue types (Task, Bug, Story, Epic, Subtask and custom ones) available in one project, with their numeric IDs and whether each is a subtask type. Call it to get the issue type ID that Create Issue with Fields and Get Issue Type Create Fields require. Read-only.',
		idempotent: true,
	},
	outputSchema: issueTypesOutputSchema,
	props: {
		projectIdOrKey: jiraAiProps.projectIdOrKey(),
	},
	async run({ auth, propsValue }) {
		const projectId = await resolveProjectId({ auth, projectIdOrKey: propsValue.projectIdOrKey });
		const issueTypes = await jiraApiCall<JiraRecord[]>({
			auth,
			method: HttpMethod.GET,
			resourceUri: '/issuetype/project',
			query: { projectId },
		});
		return { project_id: projectId, ...jiraAiHelpers.toList({ items: issueTypes }) };
	},
});

async function resolveProjectId({ auth, projectIdOrKey }: { auth: JiraAuth; projectIdOrKey: string }): Promise<string> {
	const trimmed = projectIdOrKey.trim();
	if (/^\d+$/.test(trimmed)) {
		return trimmed;
	}
	const project = await jiraApiCall<{ id: string }>({
		auth,
		method: HttpMethod.GET,
		resourceUri: `/project/${encodeURIComponent(trimmed)}`,
	});
	return project.id;
}
