import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../auth';
import { firefliesClient } from '../common/client';
import { firefliesInput } from '../common/props';
import { firefliesQueries } from '../common/queries';
import { firefliesOutputSchemas } from '../output-schemas';

export const findMeetingByIdAction = createAction({
  auth: firefliesAiAuth,
  name: 'find-meeting-by-id',
  classification: 'READ',
  displayName: 'Find Meeting by ID',
  description: 'Finds a specific meeting by ID.',
  audience: 'human',
  aiMetadata: {
    description:
      'Fetches one Fireflies meeting with its summary, speakers, attendees and media URLs by its exact meeting ID. Fails when the meeting does not exist or the API key cannot see it. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: firefliesOutputSchemas.findMeetingById,
  props: {
    meetingId: Property.ShortText({
      displayName: 'Meeting ID',
      description: 'The ID of the meeting to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const meetingId = firefliesInput.requireText({ value: context.propsValue.meetingId, label: 'Meeting ID' });
    const data = await firefliesClient.graphql({
      apiKey: context.auth,
      query: firefliesQueries.getTranscript,
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
