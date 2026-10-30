import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

export const getMeetingRecordingDetails = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_meeting_recording_details',
  displayName: 'Get Meeting Recording Details',
  description: "Gets a meeting recording's details, without the video.",
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Gets one recording's metadata (ID, creation and end time, organizer, content URL) for an online meeting the signed-in user organized. Recording IDs come from List Meeting Recordings; the video itself is not downloaded.",
    idempotent: true,
  },
  props: {
    meetingId: microsoftTeamsAiProps.meetingId({ required: true }),
    recordingId: Property.ShortText({
      displayName: 'Recording ID',
      description: 'The recording ID, from List Meeting Recordings.',
      required: true,
    }),
  },
  async run(context) {
    const { meetingId, recordingId } = context.propsValue;
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await microsoftTeamsClient.withRetry(() =>
      client.api(`/me/onlineMeetings/${meetingId}/recordings/${recordingId}`).get(),
    );
  },
});
