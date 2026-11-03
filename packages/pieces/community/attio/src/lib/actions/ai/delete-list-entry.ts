import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioDeleteListEntryOutputSchema } from '../../output-schemas';

export const attioDeleteListEntryAction = createAction({
	auth: attioAuth,
	name: 'attio_delete_list_entry',
	outputSchema: attioDeleteListEntryOutputSchema,
	displayName: 'Delete List Entry',
	description: 'Removes an entry from a list.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Removes an entry from a list. The parent record itself is not deleted. Cannot be undone.',
		idempotent: false,
	},
	props: {
		list: attioAi.listProp(),
		entry_id: attioAi.entryIdProp(),
	},
	async run(context) {
		const { list, entry_id } = context.propsValue;
		await attioApiCall({
			accessToken: context.auth.secret_text,
			method: HttpMethod.DELETE,
			resourceUri: `/lists/${list}/entries/${entry_id}`,
		});
		return { success: true, entry_id };
	},
});
