import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { createEntryOutputSchema } from '../../output-schemas';

export const attioGetListEntryAction = createAction({
	auth: attioAuth,
	name: 'attio_get_list_entry',
	outputSchema: createEntryOutputSchema,
	displayName: 'Get List Entry',
	description: 'Gets a list entry by its ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one list entry by list and entry ID, with its list-specific values.',
		idempotent: true,
	},
	props: {
		list: attioAi.listProp(),
		entry_id: attioAi.entryIdProp(),
	},
	async run(context) {
		const { list, entry_id } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/lists/${list}/entries/${entry_id}`,
		});
		return response.data;
	},
});
