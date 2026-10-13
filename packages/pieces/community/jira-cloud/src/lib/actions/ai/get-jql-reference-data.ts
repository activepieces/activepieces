import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord } from '../../common/ai-helpers';

import { jqlReferenceDataOutputSchema } from '../../output-schemas';
export const getJqlReferenceDataAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_jql_reference_data',
	classification: 'READ',
	displayName: 'Get JQL Reference Data',
	description: 'Lists the fields, functions and reserved words usable in JQL.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Return the field names (with their operators and types), functions and reserved words usable in JQL on this site, optionally filtered by field name. Use it to write a valid JQL clause for a custom field, then Get JQL Field Suggestions for its values. Read-only.',
		idempotent: true,
	},
	outputSchema: jqlReferenceDataOutputSchema,
	props: {
		fieldNameContains: Property.ShortText({
			displayName: 'Field Name Contains',
			description: 'Only return fields whose name or display name contains this text (case-insensitive).',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const response = await jiraApiCall<JqlReferenceData>({
			auth,
			method: HttpMethod.GET,
			resourceUri: '/jql/autocompletedata',
		});
		const needle = propsValue.fieldNameContains?.trim().toLowerCase() ?? '';
		const fields = (response.visibleFieldNames ?? []).filter(
			(field) =>
				needle.length === 0 ||
				String(field['value'] ?? '').toLowerCase().includes(needle) ||
				String(field['displayName'] ?? '').toLowerCase().includes(needle),
		);
		return {
			fields,
			field_count: fields.length,
			functions: response.visibleFunctionNames ?? [],
			reserved_words: response.jqlReservedWords ?? [],
		};
	},
});

type JqlReferenceData = {
	visibleFieldNames?: JiraRecord[];
	visibleFunctionNames?: JiraRecord[];
	jqlReservedWords?: string[];
};
