import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../../auth';
import { firefliesClient } from '../../common/client';
import { firefliesInput, firefliesProps } from '../../common/props';
import { firefliesQueries } from '../../common/queries';
import { firefliesOutputSchemas } from '../../output-schemas';

export const updateMeetingTitleAction = createAction({
  auth: firefliesAiAuth,
  name: 'update_meeting_title',
  classification: 'WRITE',
  displayName: 'Update Meeting Title',
  description: 'Renames a meeting.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Renames one Fireflies meeting. The title must be 5 to 256 characters. Fireflies only allows team admins to do this. Setting the same title again changes nothing, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: firefliesOutputSchemas.updateMeetingTitle,
  props: {
    meeting_id: firefliesProps.meetingId({ description: 'The Fireflies meeting ID to rename.' }),
    title: Property.ShortText({
      displayName: 'New Title',
      description: '5 to 256 characters.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const meetingId = firefliesInput.requireText({ value: propsValue.meeting_id, label: 'Meeting ID' });
    const title = firefliesInput.requireText({ value: propsValue.title, label: 'New Title', maxLength: 256 });
    if (title.length < 5) {
      throw new Error(`New Title must be at least 5 characters (got ${title.length}).`);
    }
    const data = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.updateMeetingTitle,
      variables: { id: meetingId, title },
      operation: `rename meeting ${meetingId}`,
    });
    const result = firefliesClient.requireEntity({ data, key: 'updateMeetingTitle', notFound: `Fireflies returned no result when renaming meeting "${meetingId}".` });
    return { id: meetingId, title: result['title'] ?? title };
  },
});
