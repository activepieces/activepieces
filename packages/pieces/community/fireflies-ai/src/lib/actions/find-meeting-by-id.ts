import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firefliesAiAuth } from '../../index';
import { getTranscript } from '../common/queries';
import { BASE_URL } from '../common';

export const findMeetingByIdAction = createAction({
	auth: firefliesAiAuth,
	name: 'find-meeting-by-id',
	displayName: 'Find Meeting by ID',
	description: 'Finds a specific meeting by ID.',
	props: {
		meetingId: Property.ShortText({
			displayName: 'Meeting ID',
			description: 'The ID of the meeting to retrieve.',
			required: true,
		}),
	},
	async run(context) {
		const response = await httpClient.sendRequest<{ data: { transcript: Record<string, any> } }>({
			url: BASE_URL,
			method: HttpMethod.POST,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth,
			},
			body: {
				query: getTranscript,
				variables: {
					transcriptId: context.propsValue.meetingId,
				},
			},
		});

		return response.body.data.transcript;
	},
});
