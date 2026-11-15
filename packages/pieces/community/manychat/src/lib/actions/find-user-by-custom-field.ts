import { createAction, Property } from '@activepieces/pieces-framework';
import { manychatAuth } from '../auth';
import { manychatClient, manychatUtils } from '../common/client';
import { manychatProps } from '../common/props';
import { manychatOutputSchemas } from '../common/output-schemas';

export const findUserByCustomFieldAction = createAction({
	auth: manychatAuth,
	name: 'findUserByCustomField',
	classification: 'SEARCH',
	displayName: 'Find User by Custom Field',
	description: 'Finds users whose text or number custom field equals a value. ManyChat returns at most 100 matches.',
	audience: 'both',
	aiMetadata: {
		description:
			'Searches ManyChat subscribers whose text or number custom field equals a value and returns whether any matched plus up to 100 matches (ManyChat limit, no paging). Use when you know a stored attribute but not the subscriber ID; for email or phone use "Find Subscriber by Email or Phone". Read-only.',
		idempotent: true,
	},
	outputSchema: manychatOutputSchemas.searchResult,
	props: {
		field: manychatProps.customFieldDropdown({ allowedTypes: ['text', 'number'] }),
		value: Property.ShortText({
			displayName: 'Value',
			description: 'The value to search for.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const body = await manychatClient.request({
			apiKey: manychatUtils.apiKeyOf(auth),
			method: 'GET',
			path: '/subscriber/findByCustomField',
			operation: 'find subscribers by custom field',
			query: { field_id: String(propsValue.field), field_value: propsValue.value },
		});
		const result = manychatUtils.recordsOf(manychatUtils.dataOf(body));
		return { found: result.length > 0, result };
	},
});
