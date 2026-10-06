import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { remoteIssueLinksOutputSchema } from '../../output-schemas';
export const getRemoteIssueLinksAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_remote_issue_links',
	classification: 'SEARCH',
	displayName: 'Get Remote Issue Links',
	description: 'Lists the links from an issue to external resources.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the remote links on an issue that point outside Jira, such as Confluence pages, pull requests or web URLs, with each title and URL. Links between two Jira issues are not included; read those from the issuelinks field of Fetch Issue. Read-only.',
		idempotent: true,
	},
	outputSchema: remoteIssueLinksOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
	},
	async run({ auth, propsValue }) {
		const links = await jiraApiCall<JiraRecord[]>({
			auth,
			method: HttpMethod.GET,
			resourceUri: `/issue/${encodeURIComponent(propsValue.issueIdOrKey.trim())}/remotelink`,
		});
		return jiraAiHelpers.toList({ items: links });
	},
});
