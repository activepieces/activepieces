import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typefullyAuth } from '../auth';
import { typefullyApiCall } from '../common/client';
import { socialSetDropdown } from '../common/props';
import { TypefullyDraft } from '../common/types';

export const scheduleDraftAction = createAction({
	auth: typefullyAuth,
	name: 'typefully_schedule_draft',
	displayName: 'Schedule Draft',
	description: 'Schedules an existing draft to be published at a specific time.',
	props: {
		social_set_id: socialSetDropdown,
		draft_id: Property.ShortText({
			displayName: 'Draft ID',
			description: 'The ID of the draft to schedule.',
			required: true,
		}),
		schedule_at: Property.DateTime({
			displayName: 'Schedule At',
			description:
				'The date and time to publish the draft (ISO 8601 format with timezone).',
			required: true,
		}),
	},
	async run(context) {
		const { social_set_id, draft_id, schedule_at } = context.propsValue;

		return await typefullyApiCall<TypefullyDraft>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.PATCH,
			resourceUri: `/social-sets/${social_set_id}/drafts/${draft_id}`,
			body: {
				publish_at: schedule_at,
			},
		});
	},
});
