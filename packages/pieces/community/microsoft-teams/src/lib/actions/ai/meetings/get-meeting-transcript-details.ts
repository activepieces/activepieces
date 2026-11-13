import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsGetMeetingTranscriptDetailsOutputSchema } from '../../../output-schemas';

export const getMeetingTranscriptDetails = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_meeting_transcript_details',
  displayName: 'Get Meeting Transcript Details',
  description: "Gets a meeting transcript's details, without its text.",
  audience: 'ai',
  outputSchema: microsoftTeamsGetMeetingTranscriptDetailsOutputSchema,
  classification: 'READ',
  aiMetadata: {
    description:
      "Gets one transcript's metadata (ID, creation and end time, organizer, content URL) for an online meeting the signed-in user organized. Transcript IDs come from List Meeting Transcripts; read the text with Get Meeting Transcript Content.",
    idempotent: true,
  },
  props: {
    meetingId: microsoftTeamsAiProps.meetingId({ required: true }),
    transcriptId: Property.ShortText({
      displayName: 'Transcript ID',
      description: 'The transcript ID, from List Meeting Transcripts.',
      required: true,
    }),
  },
  async run(context) {
    const { meetingId, transcriptId } = context.propsValue;
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await microsoftTeamsClient.withRetry(() =>
      client.api(`/me/onlineMeetings/${meetingId}/transcripts/${transcriptId}`).get(),
    );
  },
});
