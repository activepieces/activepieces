import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsListMeetingTranscriptsOutputSchema } from '../../../output-schemas';

export const listMeetingTranscripts = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_meeting_transcripts',
  displayName: 'List Meeting Transcripts',
  description: 'Lists the transcripts of an online meeting the signed-in user organized.',
  audience: 'ai',
  outputSchema: microsoftTeamsListMeetingTranscriptsOutputSchema,
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the transcripts of one online meeting organized by the signed-in user, with each transcript ID and creation time. Takes the online meeting ID, not a join URL; read the text with Get Meeting Transcript Content.',
    idempotent: true,
  },
  props: {
    meetingId: microsoftTeamsAiProps.meetingId({ required: true }),
  },
  async run(context) {
    return await microsoftTeamsClient.list({
      auth: context.auth,
      path: `/me/onlineMeetings/${context.propsValue.meetingId}/transcripts`,
    });
  },
});
