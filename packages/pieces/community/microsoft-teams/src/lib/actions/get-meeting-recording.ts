import { microsoftTeamsAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { microsoftTeamsCommon } from '../common';
import { createGraphClient, resolveMeetingId, withGraphRetry } from '../common/graph';

export const getMeetingRecordingAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_get_meeting_recording',
	displayName: 'Get Meeting Recording',
	description:
		'Retrieves recordings for a Teams meeting. Provide a Recording to fetch its metadata; omit it to list all available recordings.',
	props: {
		meetingIdentifierType: microsoftTeamsCommon.meetingIdentifierType,
		meetingIdentifierValue: microsoftTeamsCommon.meetingIdentifierValue,
		recordingId: microsoftTeamsCommon.recordingId,
	},
	async run(context) {
		const { meetingIdentifierType, meetingIdentifierValue, recordingId } = context.propsValue;
		const cloud = context.auth.props?.['cloud'] as string | undefined;
		const client = createGraphClient(context.auth.access_token, cloud);

		const meetingId = await withGraphRetry(() =>
			resolveMeetingId({ client, identifierType: meetingIdentifierType, identifierValue: meetingIdentifierValue }),
		);

		if (recordingId) {
			// https://learn.microsoft.com/graph/api/callrecording-get?view=graph-rest-1.0
			return await withGraphRetry(() =>
				client.api(`/me/onlineMeetings/${meetingId}/recordings/${recordingId}`).get(),
			);
		}

		// https://learn.microsoft.com/graph/api/onlinemeeting-list-recordings?view=graph-rest-1.0
		return await withGraphRetry(() =>
			client.api(`/me/onlineMeetings/${meetingId}/recordings`).get(),
		);
	},
});
