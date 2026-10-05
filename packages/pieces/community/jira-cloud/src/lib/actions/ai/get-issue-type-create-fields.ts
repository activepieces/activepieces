import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { issueTypeCreateFieldsOutputSchema } from '../../output-schemas';
export const getIssueTypeCreateFieldsAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_issue_type_create_fields',
	classification: 'READ',
	displayName: 'Get Issue Type Create Fields',
	description: 'Lists the fields available when creating an issue of a given type in a project.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the fields that can be set when creating an issue of one issue type in one project, with whether each is required, its schema and its allowed values. Call it before Create Issue with Fields to learn which custom fields are mandatory and what IDs they accept. Issue type IDs come from Get Issue Types. Read-only.',
		idempotent: true,
	},
	outputSchema: issueTypeCreateFieldsOutputSchema,
	props: {
		projectIdOrKey: jiraAiProps.projectIdOrKey(),
		issueTypeId: Property.ShortText({
			displayName: 'Issue Type ID',
			description: 'The numeric issue type ID. Find it with Get Issue Types.',
			required: true,
		}),
		startAt: jiraAiProps.startAt(),
		maxResults: jiraAiProps.maxResults({ defaultValue: 100, max: 200 }),
	},
	async run({ auth, propsValue }) {
		const response = await jiraApiCall<CreateMetaFieldsPage>({
			auth,
			method: HttpMethod.GET,
			resourceUri: `/issue/createmeta/${encodeURIComponent(propsValue.projectIdOrKey.trim())}/issuetypes/${encodeURIComponent(propsValue.issueTypeId.trim())}`,
			query: { startAt: propsValue.startAt, maxResults: propsValue.maxResults },
		});
		return jiraAiHelpers.toPage({
			items: response.fields ?? [],
			startAt: response.startAt,
			maxResults: response.maxResults,
			total: response.total,
		});
	},
});

type CreateMetaFieldsPage = {
	fields?: JiraRecord[];
	startAt?: number;
	maxResults?: number;
	total?: number;
};
