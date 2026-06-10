import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typefullyAuth } from '../auth';
import { typefullyApiCall } from '../common/client';
import { socialSetDropdown } from '../common/props';

export const deleteDraftAction = createAction({
	auth: typefullyAuth,
	name: 'typefully_delete_draft',
	displayName: 'Delete Draft',
	description: 'Delete an existing draft.',
	props: {
		social_set_id: socialSetDropdown,
		draft_id: Property.ShortText({
			displayName: 'Draft ID',
			description: 'The ID of the draft to delete.',
			required: true,
		}),
	},
	async run(context) {
		const { social_set_id, draft_id } = context.propsValue;

		await typefullyApiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.DELETE,
			resourceUri: `/social-sets/${social_set_id}/drafts/${draft_id}`,
		});

		return { success: true, deleted_draft_id: draft_id };
	},
});
