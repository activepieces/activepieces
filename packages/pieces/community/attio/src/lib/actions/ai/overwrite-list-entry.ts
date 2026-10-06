import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { createEntryOutputSchema } from '../../output-schemas';

export const attioOverwriteListEntryAction = createAction({
	auth: attioAuth,
	name: 'attio_overwrite_list_entry',
	outputSchema: createEntryOutputSchema,
	displayName: 'Overwrite List Entry',
	description: 'Updates values on a list entry, replacing multiselect attributes.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates the supplied values on a list entry, replacing (not appending to) multiselect values. Use Update List Entry to append instead.',
		idempotent: true,
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
			method: HttpMethod.PUT,
			resourceUri: `/lists/${list}/entries/${entry_id}`,
			body: { data: { entry_values } },
		});
		return response.data;
	},
});
