import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsListMeetingRecordingsOutputSchema } from '../../../output-schemas';

export const listMeetingRecordings = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_meeting_recordings',
  displayName: 'List Meeting Recordings',
  description: 'Lists the recordings of an online meeting the signed-in user organized.',
  audience: 'ai',
  outputSchema: microsoftTeamsListMeetingRecordingsOutputSchema,
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the recordings of one online meeting organized by the signed-in user, with each recording ID, creation time and content URL. Takes the online meeting ID, not a join URL; the video itself is not downloaded.',
    idempotent: true,
  },
  props: {
    meetingId: microsoftTeamsAiProps.meetingId({ required: true }),
  },
  async run(context) {
    return await microsoftTeamsClient.list({
      auth: context.auth,
      path: `/me/onlineMeetings/${context.propsValue.meetingId}/recordings`,
    });
  },
});
