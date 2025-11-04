import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firefliesAiAuth } from '../../index';
import { getTranscript } from '../common/queries';
import { isNil } from '@activepieces/shared';
import { BASE_URL } from '../common';

export const findRecentMeetingAction = createAction({
	auth: firefliesAiAuth,
	name: 'find_recent_meeting',
	displayName: 'Find Recent Meeting',
	description: 'Retrieves the latest meeting for a user.',
	props: {},
	async run(context) {
		const userResponse = await httpClient.sendRequest<{
			data: { user: { recent_meeting?: string } };
		}>({
			url: BASE_URL,
			method: HttpMethod.POST,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth,
			},
			body: {
				query: `
				query User
				{
					user
					{
						user_id
						recent_transcript
						recent_meeting
						num_transcripts
						name
						minutes_consumed
						is_admin
						integrations
						email
					}
				}`,
				variables: {},
			},
		});

		console.log(JSON.stringify(userResponse, null, 2));

		if (isNil(userResponse.body.data.user.recent_meeting)) {
			return {
				found: false,
				meeting: {},
			};
		}

		const meetingResponse = await httpClient.sendRequest<{
			data: { transcript: Record<string, any> };
		}>({
			url: BASE_URL,
			method: HttpMethod.POST,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth,
			},
			body: {
				query: getTranscript,
				variables: {
					transcriptId: userResponse.body.data.user.recent_meeting,
				},
			},
		});

		return {
			found: true,
			meeting: meetingResponse.body.data.transcript,
		};
	},
});
