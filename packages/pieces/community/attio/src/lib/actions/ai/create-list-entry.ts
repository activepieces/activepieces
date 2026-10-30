import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { createEntryOutputSchema } from '../../output-schemas';

export const attioCreateListEntryAction = createAction({
	auth: attioAuth,
	name: 'attio_create_list_entry',
	outputSchema: createEntryOutputSchema,
	displayName: 'Create List Entry',
	description: 'Adds a record to a list.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Adds a record to a list as a new entry, optionally setting list-specific values. A record can be added to the same list more than once; use Upsert List Entry to avoid duplicates.',
		idempotent: false,
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
			method: HttpMethod.POST,
			resourceUri: `/lists/${list}/entries`,
			body: { data: { parent_object, parent_record_id, entry_values: entry_values ?? {} } },
		});
		return response.data;
	},
});
