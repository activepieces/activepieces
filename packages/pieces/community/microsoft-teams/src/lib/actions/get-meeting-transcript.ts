import { microsoftTeamsAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { microsoftTeamsCommon } from '../common';
import { createGraphClient, withGraphRetry } from '../common/graph';

export const getMeetingTranscriptAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_get_meeting_transcript',
	displayName: 'Get Meeting Transcript',
	description:
		'Retrieves transcripts for a Teams meeting. Provide a Transcript to fetch its text content; omit it to list all available transcripts.',
	props: {
		meetingId: microsoftTeamsCommon.meetingId,
		transcriptId: microsoftTeamsCommon.transcriptId,
	},
	async run(context) {
		const { meetingId, transcriptId } = context.propsValue;
		const cloud = context.auth.props?.['cloud'] as string | undefined;
		const client = createGraphClient(context.auth.access_token, cloud);

		if (transcriptId) {
			// https://learn.microsoft.com/graph/api/calltranscript-get?view=graph-rest-1.0
			return await withGraphRetry(() =>
				client
					.api(`/me/onlineMeetings/${meetingId}/transcripts/${transcriptId}/content`)
					.query({ $format: 'text/vtt' })
					.get(),
			);
		}

		// https://learn.microsoft.com/graph/api/onlinemeeting-list-transcripts?view=graph-rest-1.0
		return await withGraphRetry(() =>
			client.api(`/me/onlineMeetings/${meetingId}/transcripts`).get(),
		);
	},
});
