import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseDeleteTimelineEventOutputSchema } from '../../output-schemas';

export const deleteTimelineEventAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_delete_timeline_event',
  outputSchema: metabaseDeleteTimelineEventOutputSchema,
  displayName: 'Delete Timeline Event',
  description: 'Permanently delete a timeline event.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a timeline event. To hide it instead (recoverable), use Update Timeline Event with Archived = Yes.',
    idempotent: false,
  },
  props: {
    eventId: metabaseAiProps.timelineEventId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await metabaseApi.deleteTimelineEvent({
      auth,
      eventId: propsValue.eventId,
    });
    return { deleted: true, eventId: propsValue.eventId };
  },
});
