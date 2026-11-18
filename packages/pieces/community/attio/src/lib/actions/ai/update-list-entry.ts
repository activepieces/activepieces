import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { createEntryOutputSchema } from '../../output-schemas';

export const attioUpdateListEntryAction = createAction({
	auth: attioAuth,
	name: 'attio_update_list_entry',
	outputSchema: createEntryOutputSchema,
	displayName: 'Update List Entry',
	description: 'Updates values on a list entry, appending to multiselect attributes.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates only the supplied values on a list entry; multiselect values are appended. Use Overwrite List Entry to replace multiselect values.',
		idempotent: false,
	},
	props: {
		list: attioAi.listProp(),
		entry_id: attioAi.entryIdProp(),
		entry_values: attioAi.valuesProp({
			displayName: 'Entry Values',
			description: 'List-specific attribute values keyed by attribute slug, e.g. {"stage": "Qualified"}. Use List Attributes with target `lists` for slugs.',
			required: true,
		}),
	},
	async run(context) {
		const { list, entry_id, entry_values } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.PATCH,
			resourceUri: `/lists/${list}/entries/${entry_id}`,
			body: { data: { entry_values } },
		});
		return response.data;
	},
});
