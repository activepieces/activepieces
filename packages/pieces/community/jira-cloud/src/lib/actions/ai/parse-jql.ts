import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';

import { parseJqlOutputSchema } from '../../output-schemas';
export const parseJqlAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'parse_jql',
	classification: 'READ',
	displayName: 'Parse JQL',
	description: 'Validates JQL queries and returns their structure.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Validate one or more JQL queries and return, for each, its parsed structure plus any errors or warnings such as unknown fields or values. Use it to check a generated query before Search Issues by JQL or Count Issues. Read-only.',
		idempotent: true,
	},
	outputSchema: parseJqlOutputSchema,
	props: {
		queries: Property.Array({
			displayName: 'Queries',
			description: 'JQL queries to parse.',
			required: true,
		}),
		validation: Property.StaticDropdown({
			displayName: 'Validation',
			description: 'Strict reports unknown fields and values as errors, warn reports them as warnings, none only checks syntax.',
			required: false,
			defaultValue: 'strict',
			options: {
				options: [
					{ label: 'Strict', value: 'strict' },
					{ label: 'Warn', value: 'warn' },
					{ label: 'None', value: 'none' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const queries = jiraAiHelpers.toStringList({ value: propsValue.queries });
		if (queries.length === 0) {
			throw new Error('Provide at least one JQL query.');
		}
		const response = await jiraApiCall<{ queries?: JiraRecord[] }>({
			auth,
			method: HttpMethod.POST,
			resourceUri: '/jql/parse',
			query: { validation: propsValue.validation ?? 'strict' },
			body: { queries },
		});
		return jiraAiHelpers.toList({ items: response.queries ?? [] });
	},
});
