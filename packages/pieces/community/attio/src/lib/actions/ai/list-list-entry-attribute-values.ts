import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioListListEntryAttributeValuesOutputSchema } from '../../output-schemas';

export const attioListListEntryAttributeValuesAction = createAction({
	auth: attioAuth,
	name: 'attio_list_list_entry_attribute_values',
	outputSchema: attioListListEntryAttributeValuesOutputSchema,
	displayName: 'List List Entry Attribute Values',
	description: 'Lists current or historic values of one attribute on a list entry.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the values of one list attribute on an entry, optionally including historic values to see how it changed, e.g. stage history.',
		idempotent: true,
	},
	props: {
		list: attioAi.listProp(),
		entry_id: attioAi.entryIdProp(),
		attribute: attioAi.attributeProp(),
		show_historic: Property.Checkbox({
			displayName: 'Show Historic',
			description: 'Include values that are no longer active.',
			required: false,
		}),
		limit: attioAi.limitProp({ max: 500 }),
		offset: attioAi.offsetProp(),
	},
	async run(context) {
		const { list, entry_id, attribute, show_historic, limit, offset } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown>[] }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/lists/${list}/entries/${entry_id}/attributes/${attribute}/values`,
			query: { show_historic: show_historic ? 'true' : undefined, limit, offset },
		});
		return { values: response.data, count: response.data.length };
	},
});
