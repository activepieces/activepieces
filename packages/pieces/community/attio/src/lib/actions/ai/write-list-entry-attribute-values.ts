import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioListRecordAttributeValuesOutputSchema } from '../../output-schemas';

export const attioWriteListEntryAttributeValuesAction = createAction({
	auth: attioAuth,
	name: 'attio_write_list_entry_attribute_values',
	outputSchema: attioListRecordAttributeValuesOutputSchema,
	displayName: 'Write List Entry Attribute Values',
	description: 'Replaces the full value history of one attribute on a list entry.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Replaces the entire value history of one list attribute on an entry, e.g. to backfill stage history. Existing history for that attribute is overwritten. Use Update List Entry to just set the current value.',
		idempotent: true,
	},
	props: {
		list: attioAi.listProp(),
		entry_id: attioAi.entryIdProp(),
		attribute: attioAi.attributeProp(),
		values: Property.Array({
			displayName: 'Values',
			description: 'The full value history to write. Each value needs the time it became active.',
			required: true,
			properties: {
				value: Property.ShortText({
					displayName: 'Value',
					description: 'The value. JSON is parsed, e.g. `42`, `true` or {"currency_value": 10}; anything else is sent as text.',
					required: true,
				}),
				active_from: Property.ShortText({ displayName: 'Active From', description: 'ISO 8601 timestamp.', required: true }),
				active_until: Property.ShortText({ displayName: 'Active Until', description: 'ISO 8601 timestamp; leave empty for the current value.', required: false }),
			},
		}),
	},
	async run(context) {
		const { list, entry_id, attribute, values } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown>[] }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.PUT,
			resourceUri: `/lists/${list}/entries/${entry_id}/attributes/${attribute}/values`,
			body: {
				data: {
					values: attioAi.records(values).map((item) => ({
						value: attioAi.parseLooseValue(item['value']),
						active_from: item['active_from'],
						active_until: item['active_until'] ?? null,
					})),
					replace_history: true,
				},
			},
		});
		return { values: response.data, count: response.data.length };
	},
});
