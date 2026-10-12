import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';

import { fieldsListOutputSchema } from '../../output-schemas';
export const getFieldsAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_fields',
	classification: 'SEARCH',
	displayName: 'Get Fields',
	description: 'Lists all system and custom issue fields.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List every system and custom issue field with its ID (e.g. customfield_10016), name and schema type. Use it to translate a field name into the ID that Create Issue, Edit Issue and JQL need; for the fields allowed on one project and issue type use Get Issue Type Create Fields instead. Read-only.',
		idempotent: true,
	},
	outputSchema: fieldsListOutputSchema,
	props: {
		nameContains: Property.ShortText({
			displayName: 'Name Contains',
			description: 'Only return fields whose name contains this text (case-insensitive).',
			required: false,
		}),
		customOnly: Property.Checkbox({
			displayName: 'Custom Fields Only',
			description: 'Only return custom fields.',
			required: false,
			defaultValue: false,
		}),
	},
	async run({ auth, propsValue }) {
		const fields = await jiraApiCall<JiraRecord[]>({
			auth,
			method: HttpMethod.GET,
			resourceUri: '/field',
		});
		const needle = propsValue.nameContains?.trim().toLowerCase() ?? '';
		const items = fields.filter(
			(field) =>
				(!propsValue.customOnly || field['custom'] === true) &&
				(needle.length === 0 || String(field['name'] ?? '').toLowerCase().includes(needle)),
		);
		return jiraAiHelpers.toList({ items });
	},
});
