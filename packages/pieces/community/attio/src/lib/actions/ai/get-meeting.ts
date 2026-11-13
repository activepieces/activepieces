import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioCreateMeetingOutputSchema } from '../../output-schemas';

export const attioGetMeetingAction = createAction({
	auth: attioAuth,
	name: 'attio_get_meeting',
	outputSchema: attioCreateMeetingOutputSchema,
	displayName: 'Get Meeting',
	description: 'Gets a meeting by its ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one meeting by ID, with participants and linked records. Use List Call Recordings for its recordings.',
		idempotent: true,
	},
	props: {
		meeting_id: Property.ShortText({ displayName: 'Meeting ID', description: 'From List Meetings or Create Meeting.', required: true }),
	},
	async run(context) {
		const { meeting_id } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/meetings/${meeting_id}`,
		});
		return response.data;
	},
});
