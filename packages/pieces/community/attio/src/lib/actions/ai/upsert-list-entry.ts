import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { createEntryOutputSchema } from '../../output-schemas';

export const attioUpsertListEntryAction = createAction({
	auth: attioAuth,
	name: 'attio_upsert_list_entry',
	outputSchema: createEntryOutputSchema,
	displayName: 'Upsert List Entry',
	description: 'Adds a record to a list, or updates its entry if already there.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Adds the record to the list, or updates its existing entry if the record is already in the list. Prefer this over Create List Entry to avoid duplicate entries. Multiselect values are replaced.',
		idempotent: true,
	},
	props: {
		list: attioAi.listProp(),
		parent_object: attioAi.objectProp(),
		parent_record_id: attioAi.recordIdProp({ description: 'ID of the record to add to the list.' }),
		entry_values: attioAi.valuesProp({
			displayName: 'Entry Values',
			description: 'List-specific attribute values keyed by attribute slug, e.g. {"stage": "Qualified"}. Use List Attributes with target `lists` for slugs.',
			required: false,
		}),
	},
	async run(context) {
		const { list, parent_object, parent_record_id, entry_values } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.PUT,
			resourceUri: `/lists/${list}/entries`,
			body: { data: { parent_object, parent_record_id, entry_values: entry_values ?? {} } },
		});
		return response.data;
	},
});
