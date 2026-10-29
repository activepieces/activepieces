import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateTimelineEventOutputSchema } from '../../output-schemas';

export const getTimelineEventAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_timeline_event',
  outputSchema: metabaseCreateTimelineEventOutputSchema,
  displayName: 'Get Timeline Event',
  description: 'Get a timeline event by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one timeline event with its name, timestamp, time zone and timeline.',
    idempotent: true,
  },
  props: {
    eventId: metabaseAiProps.timelineEventId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getTimelineEvent({
      auth,
      eventId: propsValue.eventId,
    });
  },
});
