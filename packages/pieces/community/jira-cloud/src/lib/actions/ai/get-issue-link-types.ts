import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';

import { issueLinkTypesOutputSchema } from '../../output-schemas';
export const getIssueLinkTypesAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_issue_link_types',
	classification: 'SEARCH',
	displayName: 'Get Issue Link Types',
	description: 'Lists the issue link types configured in Jira.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the issue link types configured on the site (e.g. Blocks, Relates, Duplicates), each with its name and inward/outward wording. Call it before Create Issue Link to pick a valid link type name and the correct direction. Read-only.',
		idempotent: true,
	},
	outputSchema: issueLinkTypesOutputSchema,
	props: {},
	async run({ auth }) {
		const response = await jiraApiCall<{ issueLinkTypes?: JiraRecord[] }>({
			auth,
			method: HttpMethod.GET,
			resourceUri: '/issueLinkType',
		});
		return jiraAiHelpers.toList({ items: response.issueLinkTypes ?? [] });
	},
});
