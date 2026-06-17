import { Property, createAction } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { searchIssuesByJql } from '../common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const searchIssuesAction = createAction({
	name: 'search_issues',
	displayName: 'Search Issues',
	description: 'Search for issues with JQL',
	audience: 'both',
	aiMetadata: {
		description:
			'Searches issues in Jira Data Center/Server using a JQL query and returns the matching issues (capped by Max Results, 1-100). Use when an agent needs to find or list issues by any criteria expressible in JQL — project, status, assignee, date, label, etc. Requires a valid JQL string. Read-only and idempotent.',
		idempotent: true,
	},
	auth: jiraDataCenterAuth,
	props: {
		jql: Property.LongText({
			displayName: 'JQL',
			description: 'The JQL query to use in the search',
			defaultValue: `type = story and created > '2023-12-13 14:00'`,
			required: true,
		}),
		maxResults: Property.Number({
			displayName: 'Max Results',
			defaultValue: 50,
			required: true,
		}),
	},
	run: async ({ auth, propsValue }) => {
		await propsValidation.validateZod(propsValue, {
			maxResults: z.number().min(1).max(100),
		});
		const { jql, maxResults } = propsValue;
		return await searchIssuesByJql({
			auth,
			jql,
			maxResults: maxResults,
		});
	},
});
