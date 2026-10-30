import { microsoftTeamsAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { microsoftTeamsProps } from '../common/props';
import { microsoftTeamsClient } from '../common/client';
import { microsoftTeamsApi } from '../common/api';

export const getMeetingRecordingAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_get_meeting_recording',
	classification: 'SEARCH',
	displayName: 'Get Meeting Recording',
	description:
		'Retrieves recordings for a Teams meeting. Provide a Recording to fetch its metadata; omit it to list all available recordings.',
	audience: 'both',
	aiMetadata: {
		description: 'Retrieves recordings for a Microsoft Teams online meeting belonging to the authenticated user, resolved from a meeting identifier (join URL or ID). Operates in two modes: with a recording ID it fetches that recording\'s metadata; without one it lists all available recordings for the meeting. Idempotent read-only operation.',
		idempotent: true,
	},
	props: {
		meetingIdentifierType: microsoftTeamsProps.meetingIdentifierType({ required: true }),
		meetingIdentifierValue: microsoftTeamsProps.meetingIdentifierValue({ required: true }),
		recordingId: microsoftTeamsProps.recordingId({ required: false }),
	},
	async run(context) {
		const { meetingIdentifierType, meetingIdentifierValue, recordingId } = context.propsValue;
		const client = microsoftTeamsClient.create({ auth: context.auth });

		const meetingId = await microsoftTeamsClient.withRetry(() =>
			microsoftTeamsApi.resolveMeetingId({ client, identifierType: meetingIdentifierType, identifierValue: meetingIdentifierValue }),
		);

		if (recordingId) {
			return await microsoftTeamsClient.withRetry(() =>
				client.api(`/me/onlineMeetings/${meetingId}/recordings/${recordingId}`).get(),
			);
		}

		return await microsoftTeamsClient.withRetry(() =>
			client.api(`/me/onlineMeetings/${meetingId}/recordings`).get(),
		);
	},
});
