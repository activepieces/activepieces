import { createAction } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../../auth';
import { firefliesClient } from '../../common/client';
import { firefliesInput, firefliesProps } from '../../common/props';
import { firefliesQueries } from '../../common/queries';
import { firefliesOutputSchemas } from '../../output-schemas';

export const deleteMeetingAction = createAction({
  auth: firefliesAiAuth,
  name: 'delete_meeting',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Meeting',
  description: 'Permanently deletes a meeting and its transcript.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one Fireflies meeting with its transcript, summary and recording, and returns what was deleted. Cannot be undone. Deleting another member\'s meeting needs a team admin. Limited to 10 deletes per minute; a repeat call fails because the meeting is gone.',
    idempotent: false,
  },
  outputSchema: firefliesOutputSchemas.deleteMeeting,
  props: {
    meeting_id: firefliesProps.meetingId({ description: 'The Fireflies meeting ID to delete.' }),
  },
  async run({ auth, propsValue }) {
    const meetingId = firefliesInput.requireText({ value: propsValue.meeting_id, label: 'Meeting ID' });
    const data = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.deleteTranscript,
      variables: { transcriptId: meetingId },
      operation: `delete meeting ${meetingId}`,
    });
    return firefliesClient.requireEntity({
      data,
      key: 'deleteTranscript',
      notFound: `Fireflies returned nothing when deleting meeting "${meetingId}", so it is not confirmed as deleted. Check it with Get Meeting.`,
    });
  },
});
