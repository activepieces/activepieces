import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickCreateFocusOutputSchema } from '../../output-schemas';

export const getFocusAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_get_focus',
	outputSchema: ticktickCreateFocusOutputSchema,
	displayName: 'Get Focus Record',
	description: 'Retrieves a focus record by its ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fetches one focus record by focusId from ticktick_list_focuses. The type (pomodoro or timing) must match the record. Read-only.',
		idempotent: true,
	},
	props: {
		focusId: Property.ShortText({
			displayName: 'Focus ID',
			description: 'The focus record ID, from the List Focus Records action.',
			required: true,
		}),
		type: Property.StaticDropdown({
			displayName: 'Type',
			required: true,
			options: {
				options: [
					{ label: 'Pomodoro', value: 0 },
					{ label: 'Timing', value: 1 },
				],
			},
		}),
	},
	async run(context) {
		const { focusId, type } = context.propsValue;
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: `/focus/${focusId}`,
			query: { type },
		});
	},
});
