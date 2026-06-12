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
	audience: 'both',
	aiMetadata: {
		description:
			'Permanently deletes a Typefully draft identified by its draft ID within a social set. Use to remove an unwanted draft; this is destructive and cannot be undone. Requires both the social set ID and the draft ID. Repeating the call on an already-deleted draft has no further effect.',
		idempotent: false,
	},
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
