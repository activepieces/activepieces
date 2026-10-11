import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';

import { searchIssuesByJqlOutputSchema } from '../../output-schemas';
export const searchIssuesByJqlAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'search_issues_by_jql',
	classification: 'SEARCH',
	displayName: 'Search Issues by JQL',
	description: 'Searches issues with a JQL query, one page at a time.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Search issues with a JQL query (e.g. project = PROJ AND assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC) and return one page of up to 100 issues with a lean default field set. Pass the returned next_page_token to get the next page; for just a total use Count Issues. JQL must be bounded by at least one restriction. Read-only.',
		idempotent: true,
	},
	outputSchema: searchIssuesByJqlOutputSchema,
	props: {
		jql: Property.LongText({
			displayName: 'JQL',
			description: 'The JQL query. Use single quotes or escaped double quotes around values with spaces.',
			required: true,
		}),
		fields: Property.Array({
			displayName: 'Fields',
			description: 'Field IDs to return. Defaults to summary, status, assignee, reporter, priority, issuetype, project, created, updated. Use *all for every field.',
			required: false,
		}),
		maxResults: Property.Number({
			displayName: 'Max Results',
			description: 'Issues per page (1-100).',
			required: false,
			defaultValue: 50,
		}),
		nextPageToken: Property.ShortText({
			displayName: 'Next Page Token',
			description: 'The next_page_token from a previous call, to fetch the following page.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const maxResults = propsValue.maxResults ?? 50;
		if (maxResults < 1 || maxResults > 100) {
			throw new Error('Max Results must be between 1 and 100.');
		}
		const fields = jiraAiHelpers.toStringList({ value: propsValue.fields });
		const response = await jiraApiCall<SearchResponse>({
			auth,
			method: HttpMethod.POST,
			resourceUri: '/search/jql',
			body: {
				jql: propsValue.jql,
				maxResults,
				fields: fields.length > 0 ? fields : DEFAULT_FIELDS,
				...(jiraAiHelpers.isProvided(propsValue.nextPageToken) ? { nextPageToken: propsValue.nextPageToken.trim() } : {}),
			},
		});
		const issues = response.issues ?? [];
		return {
			items: issues,
			count: issues.length,
			next_page_token: response.nextPageToken ?? null,
			is_last: response.isLast ?? response.nextPageToken === undefined,
		};
	},
});

const DEFAULT_FIELDS = ['summary', 'status', 'assignee', 'reporter', 'priority', 'issuetype', 'project', 'created', 'updated'];

type SearchResponse = {
	issues?: JiraRecord[];
	nextPageToken?: string;
	isLast?: boolean;
};
