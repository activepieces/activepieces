import { microsoftTeamsAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { ResponseType } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';
import { createGraphClient, resolveMeetingId, withGraphRetry } from '../common/graph';

export const getMeetingTranscriptAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_get_meeting_transcript',
	displayName: 'Get Meeting Transcript',
	description:
		'Retrieves transcripts for a Teams meeting. Provide a Transcript to fetch its text content; omit it to list all available transcripts.',
	props: {
		meetingIdentifierType: microsoftTeamsCommon.meetingIdentifierType,
		meetingIdentifierValue: microsoftTeamsCommon.meetingIdentifierValue,
		transcriptId: microsoftTeamsCommon.transcriptId,
	},
	async run(context) {
		const { meetingIdentifierType, meetingIdentifierValue, transcriptId } = context.propsValue;
		const cloud = context.auth.props?.['cloud'] as string | undefined;
		const client = createGraphClient(context.auth.access_token, cloud);

		const meetingId = await withGraphRetry(() =>
			resolveMeetingId({ client, identifierType: meetingIdentifierType, identifierValue: meetingIdentifierValue }),
		);

		if (transcriptId) {
			// https://learn.microsoft.com/graph/api/calltranscript-get?view=graph-rest-1.0
			const content = await withGraphRetry(() =>
				client
					.api(`/me/onlineMeetings/${meetingId}/transcripts/${transcriptId}/content`)
					.header('Accept', 'text/vtt')
					.responseType(ResponseType.TEXT)
					.get(),
			);
			return { content };
		}

		// https://learn.microsoft.com/graph/api/onlinemeeting-list-transcripts?view=graph-rest-1.0
		return await withGraphRetry(() =>
			client.api(`/me/onlineMeetings/${meetingId}/transcripts`).get(),
		);
	},
});
