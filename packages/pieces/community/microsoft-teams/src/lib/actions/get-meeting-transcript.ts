import { microsoftTeamsAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { ResponseType } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsProps } from '../common/props';
import { microsoftTeamsClient } from '../common/client';
import { microsoftTeamsApi } from '../common/api';
import { microsoftTeamsGetMeetingTranscriptOutputSchema } from '../output-schemas';

export const getMeetingTranscriptAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_get_meeting_transcript',
	classification: 'SEARCH',
	displayName: 'Get Meeting Transcript',
	description:
		'Retrieves transcripts for a Teams meeting. Provide a Transcript to fetch its text content; omit it to list all available transcripts.',
	audience: 'human',
	outputSchema: microsoftTeamsGetMeetingTranscriptOutputSchema,
	aiMetadata: {
		description: 'Retrieves transcripts for a Microsoft Teams online meeting belonging to the authenticated user, resolved from a meeting identifier (join URL or ID). Operates in two modes: with a transcript ID it fetches that transcript\'s text content (VTT); without one it lists all available transcripts for the meeting. Idempotent read-only operation.',
		idempotent: true,
	},
	props: {
		meetingIdentifierType: microsoftTeamsProps.meetingIdentifierType({ required: true }),
		meetingIdentifierValue: microsoftTeamsProps.meetingIdentifierValue({ required: true }),
		transcriptId: microsoftTeamsProps.transcriptId({ required: false }),
	},
	async run(context) {
		const { meetingIdentifierType, meetingIdentifierValue, transcriptId } = context.propsValue;
		const client = microsoftTeamsClient.create({ auth: context.auth });

		const meetingId = await microsoftTeamsClient.withRetry(() =>
			microsoftTeamsApi.resolveMeetingId({ client, identifierType: meetingIdentifierType, identifierValue: meetingIdentifierValue }),
		);

		if (transcriptId) {
			const content = await microsoftTeamsClient.withRetry(() =>
				client
					.api(`/me/onlineMeetings/${meetingId}/transcripts/${transcriptId}/content`)
					.header('Accept', 'text/vtt')
					.responseType(ResponseType.TEXT)
					.get(),
			);
			return { content };
		}

		return await microsoftTeamsClient.withRetry(() =>
			client.api(`/me/onlineMeetings/${meetingId}/transcripts`).get(),
		);
	},
});
