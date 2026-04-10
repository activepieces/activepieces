import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typefullyAuth } from '../auth';
import { typefullyApiCall } from '../common/client';
import { socialSetDropdown } from '../common/props';
import { TypefullyDraft } from '../common/types';

export const publishDraftNowAction = createAction({
	auth: typefullyAuth,
	name: 'typefully_publish_draft_now',
	displayName: 'Publish Draft Now',
	description:
		'Immediately publishes an existing draft to all configured platforms.',
	props: {
		social_set_id: socialSetDropdown,
		draft_id: Property.ShortText({
			displayName: 'Draft ID',
			description: 'The ID of the draft to publish.',
			required: true,
		}),
	},
	async run(context) {
		const { social_set_id, draft_id } = context.propsValue;

		// https://support.typefully.com/en/articles/13133296-typefully-api-v1-v2-migration-guide#h_687086a25b
		return await typefullyApiCall<TypefullyDraft>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.PATCH,
			resourceUri: `/social-sets/${social_set_id}/drafts/${draft_id}`,
			body: {
				publish_at: 'now',
			},
		});
	},
});
