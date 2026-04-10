import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typefullyAuth } from '../auth';
import { typefullyApiCall } from '../common/client';
import { socialSetDropdown } from '../common/props';
import { TypefullyDraft } from '../common/types';

export const getDraftAction = createAction({
	auth: typefullyAuth,
	name: 'typefully_get_draft',
	displayName: 'Get Draft',
	description: 'Retrieve a specific draft by its ID.',
	props: {
		social_set_id: socialSetDropdown,
		draft_id: Property.ShortText({
			displayName: 'Draft ID',
			description: 'The ID of the draft to retrieve.',
			required: true,
		}),
	},
	async run(context) {
		const { social_set_id, draft_id } = context.propsValue;

		return await typefullyApiCall<TypefullyDraft>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/social-sets/${social_set_id}/drafts/${draft_id}`,
		});
	},
});
