import { createAction } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../../auth';
import { firefliesClient } from '../../common/client';
import { firefliesInput, firefliesProps } from '../../common/props';
import { firefliesQueries } from '../../common/queries';
import { firefliesOutputSchemas } from '../../output-schemas';

export const getMeetingSummaryAction = createAction({
  auth: firefliesAiAuth,
  name: 'get_meeting_summary',
  classification: 'READ',
  displayName: 'Get Meeting Summary',
  description: 'Gets the AI summary of one meeting.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets the Fireflies AI summary of one meeting by ID: overview, notes, action items, keywords, outline, topics and chapters. Check summary_status: while it is "processing" the summary may be empty, so try again later. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: firefliesOutputSchemas.getMeetingSummary,
  props: {
    meeting_id: firefliesProps.meetingId({ description: 'The Fireflies meeting ID, for example from Find Meetings.' }),
  },
  async run({ auth, propsValue }) {
    const meetingId = firefliesInput.requireText({ value: propsValue.meeting_id, label: 'Meeting ID' });
    const data = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.getMeetingSummary,
      variables: { transcriptId: meetingId },
      operation: `get the summary of meeting ${meetingId}`,
    });
    const meeting = firefliesClient.requireEntity({
      data,
      key: 'transcript',
      notFound: `Meeting "${meetingId}" was not found, or the API key's user cannot access it.`,
    });
    const info = firefliesClient.isRecord(meeting['meeting_info']) ? meeting['meeting_info'] : {};
    return {
      id: meeting['id'] ?? meetingId,
      title: meeting['title'] ?? null,
      dateString: meeting['dateString'] ?? null,
      summary_status: info['summary_status'] ?? null,
      summary: firefliesClient.isRecord(meeting['summary']) ? meeting['summary'] : null,
    };
  },
});
