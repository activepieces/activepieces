import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { issueEditMetadataOutputSchema } from '../../output-schemas';
export const getIssueEditMetadataAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_issue_edit_metadata',
	classification: 'READ',
	displayName: 'Get Issue Edit Metadata',
	description: 'Lists the fields that can be edited on an issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the fields that can be edited on one existing issue, keyed by field ID, with each field schema, allowed operations and allowed values. Call it before Edit Issue to learn which fields and option IDs the issue accepts. Read-only.',
		idempotent: true,
	},
	outputSchema: issueEditMetadataOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
	},
	async run({ auth, propsValue }) {
		return jiraApiCall<JiraRecord>({
			auth,
			method: HttpMethod.GET,
			resourceUri: `/issue/${encodeURIComponent(propsValue.issueIdOrKey.trim())}/editmeta`,
		});
	},
});
