import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';

import { jqlSuggestionsOutputSchema } from '../../output-schemas';
export const getJqlFieldSuggestionsAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_jql_field_suggestions',
	classification: 'SEARCH',
	displayName: 'Get JQL Field Suggestions',
	description: 'Suggests valid values for a JQL field.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Suggest valid JQL values for one field, e.g. the exact names of statuses, sprints, labels or custom field options, optionally matching partially typed text. Use it to write exact values in JQL for Search Issues by JQL; field names come from Get JQL Reference Data. Read-only.',
		idempotent: true,
	},
	outputSchema: jqlSuggestionsOutputSchema,
	props: {
		fieldName: Property.ShortText({
			displayName: 'Field Name',
			description: 'The JQL field name, e.g. status, labels, sprint, or cf[10016].',
			required: true,
		}),
		fieldValue: Property.ShortText({
			displayName: 'Partial Value',
			description: 'Partially typed value to match.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const response = await jiraApiCall<{ results?: JiraRecord[] }>({
			auth,
			method: HttpMethod.GET,
			resourceUri: '/jql/autocompletedata/suggestions',
			query: { fieldName: propsValue.fieldName.trim(), fieldValue: propsValue.fieldValue },
		});
		return jiraAiHelpers.toList({ items: response.results ?? [] });
	},
});
