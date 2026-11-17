import { createAction } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../../auth';
import { firefliesClient } from '../../common/client';
import { firefliesInput, firefliesProps } from '../../common/props';
import { firefliesQueries } from '../../common/queries';
import { firefliesOutputSchemas } from '../../output-schemas';

export const getMeetingAction = createAction({
  auth: firefliesAiAuth,
  name: 'get_meeting',
  classification: 'READ',
  displayName: 'Get Meeting',
  description: 'Gets the details of one meeting, without its summary or transcript.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets one Fireflies meeting by ID: title, date, duration, privacy, organizer, participants, speakers, attendance, channels and summary status. Has no summary or transcript text; use Get Meeting Summary or Get Meeting Transcript for those. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: firefliesOutputSchemas.getMeeting,
  props: {
    meeting_id: firefliesProps.meetingId({ description: 'The Fireflies meeting ID, for example from Find Meetings.' }),
  },
  async run({ auth, propsValue }) {
    const meetingId = firefliesInput.requireText({ value: propsValue.meeting_id, label: 'Meeting ID' });
    const data = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.getMeeting,
      variables: { transcriptId: meetingId },
      operation: `get meeting ${meetingId}`,
    });
    return firefliesClient.requireEntity({
      data,
      key: 'transcript',
      notFound: `Meeting "${meetingId}" was not found, or the API key's user cannot access it.`,
    });
  },
});
