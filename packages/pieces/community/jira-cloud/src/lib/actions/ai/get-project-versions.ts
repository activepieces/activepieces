import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraPageBean, JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { versionsOutputSchema } from '../../output-schemas';
export const getProjectVersionsAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_project_versions',
	classification: 'SEARCH',
	displayName: 'Get Project Versions',
	description: 'Lists the versions (releases) of a project.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the versions (releases) of one project, optionally filtered by name and by released, unreleased or archived status, with their IDs and release dates. Use it to find the version IDs that the fixVersions field of Create Issue with Fields or Edit Issue expects. Read-only.',
		idempotent: true,
	},
	outputSchema: versionsOutputSchema,
	props: {
		projectIdOrKey: jiraAiProps.projectIdOrKey(),
		query: Property.ShortText({
			displayName: 'Query',
			description: 'Only return versions whose name or description contains this text.',
			required: false,
		}),
		status: Property.StaticMultiSelectDropdown({
			displayName: 'Status',
			description: 'Only return versions with these statuses.',
			required: false,
			options: {
				options: [
					{ label: 'Released', value: 'released' },
					{ label: 'Unreleased', value: 'unreleased' },
					{ label: 'Archived', value: 'archived' },
				],
			},
		}),
		startAt: jiraAiProps.startAt(),
		maxResults: jiraAiProps.maxResults(),
	},
	async run({ auth, propsValue }) {
		const response = await jiraApiCall<JiraPageBean<JiraRecord>>({
			auth,
			method: HttpMethod.GET,
			resourceUri: `/project/${encodeURIComponent(propsValue.projectIdOrKey.trim())}/version`,
			query: {
				query: propsValue.query,
				status: propsValue.status,
				startAt: propsValue.startAt,
				maxResults: propsValue.maxResults,
			},
		});
		return jiraAiHelpers.toPage({
			items: response.values ?? [],
			startAt: response.startAt,
			maxResults: response.maxResults,
			total: response.total,
			isLast: response.isLast,
		});
	},
});
