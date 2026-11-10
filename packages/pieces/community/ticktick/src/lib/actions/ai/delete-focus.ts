import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickCreateFocusOutputSchema } from '../../output-schemas';

export const deleteFocusAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_delete_focus',
	outputSchema: ticktickCreateFocusOutputSchema,
	displayName: 'Delete Focus Record',
	description: 'Deletes a focus record.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes a focus record by focusId from ticktick_list_focuses; the type must match the record. Returns the deleted record. Confirm the target before calling.',
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
			method: HttpMethod.DELETE,
			resourceUri: `/focus/${focusId}`,
			query: { type },
		});
	},
});
