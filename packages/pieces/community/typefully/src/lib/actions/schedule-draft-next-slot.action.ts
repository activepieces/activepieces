import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typefullyAuth } from '../auth';
import { typefullyApiCall } from '../common/client';
import { socialSetDropdown } from '../common/props';
import { TypefullyDraft } from '../common/types';

export const scheduleDraftNextSlotAction = createAction({
	auth: typefullyAuth,
	name: 'typefully_schedule_draft_next_slot',
	displayName: 'Schedule Draft in Next Free Slot',
	description:
		'Schedule an existing draft to be published in the next available slot based on your publishing schedule.',
	props: {
		social_set_id: socialSetDropdown,
		draft_id: Property.ShortText({
			displayName: 'Draft ID',
			description: 'The ID of the draft to schedule.',
			required: true,
		}),
	},
	async run(context) {
		const { social_set_id, draft_id } = context.propsValue;

		return await typefullyApiCall<TypefullyDraft>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.PATCH,
			resourceUri: `/social-sets/${social_set_id}/drafts/${draft_id}`,
			body: {
				schedule: 'next_free_slot',
			},
		});
	},
});
