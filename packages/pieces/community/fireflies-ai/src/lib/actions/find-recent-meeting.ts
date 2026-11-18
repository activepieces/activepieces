import { createAction } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../auth';
import { firefliesClient } from '../common/client';
import { firefliesInput } from '../common/props';
import { firefliesQueries } from '../common/queries';
import { firefliesOutputSchemas } from '../output-schemas';

export const findRecentMeetingAction = createAction({
  auth: firefliesAiAuth,
  name: 'find_recent_meeting',
  classification: 'READ',
  displayName: 'Find Recent Meeting',
  description: 'Retrieves the latest meeting for a user.',
  audience: 'human',
  aiMetadata: {
    description:
      'Returns the meeting most recently added to Fireflies for the API key owner (the newest transcription, which can differ from the latest meeting date), with its summary, speakers and attendees. Returns found:false when the account has no meetings. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: firefliesOutputSchemas.findRecentMeeting,
  props: {},
  async run(context) {
    const userData = await firefliesClient.graphql({
      apiKey: context.auth,
      query: firefliesQueries.currentUser,
      operation: 'get the current user',
    });
    const user = firefliesClient.requireEntity({
      data: userData,
      key: 'user',
      notFound: 'Fireflies returned no user for this API key.',
    });
    const recentMeetingId = firefliesInput.optionalText(user['recent_meeting']);
    if (recentMeetingId === undefined) {
      return { found: false, meeting: {} };
    }
    const meetingData = await firefliesClient.graphql({
      apiKey: context.auth,
      query: firefliesQueries.getTranscript,
      variables: { transcriptId: recentMeetingId },
      operation: `get the most recent meeting ${recentMeetingId}`,
    });
    const meeting = firefliesClient.requireEntity({
      data: meetingData,
      key: 'transcript',
      notFound: `Fireflies lists "${recentMeetingId}" as the most recent meeting, but returned no meeting for that ID.`,
    });
    return { found: true, meeting };
  },
});
