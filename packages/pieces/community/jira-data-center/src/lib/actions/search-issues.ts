import { Property, createAction } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { searchIssuesByJql } from '../common';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';

export const searchIssuesAction = createAction({
	name: 'search_issues',
	classification: 'SEARCH',
	displayName: 'Search Issues',
	description: 'Finds issues that match a JQL query.',
	audience: 'both',
	aiMetadata: {
		description:
			'Searches issues in Jira Data Center/Server using a JQL query and returns the matching issues (capped by Max Results, 1-100). Use when an agent needs to find or list issues by any criteria expressible in JQL — project, status, assignee, date, label, etc. Requires a valid JQL string. Read-only and idempotent.',
		idempotent: true,
	},
	auth: jiraDataCenterAuth,
	propertyGroups: [
		{
			key: 'query',
			display: 'section',
			label: 'Query',
			icon: 'filter',
			props: ['jql'],
		},
		{
			key: 'results',
			display: 'section',
			label: 'Results',
			icon: 'sliders',
			props: ['maxResults'],
		},
	],
	props: {
		jql: Property.LongText({
			displayName: 'JQL',
			description: 'Put text and dates in single quotes.',
			defaultValue: `type = story and created > '2023-12-13 14:00'`,
			required: true,
		}),
		maxResults: Property.Number({
			displayName: 'Max Results',
			description: 'Most issues to return, up to 100.',
			display: 'stepper',
			min: 1,
			max: 100,
			step: 1,
			defaultValue: 50,
			required: true,
		}),
	},
	run: async ({ auth, propsValue }) => {
		await propsValidation.validateZod(propsValue, {
			maxResults: z.number().check(z.minimum(1), z.maximum(100)),
		});
		const { jql, maxResults } = propsValue;
		return await searchIssuesByJql({
			auth,
			jql,
			maxResults: maxResults,
		});
	},
});
