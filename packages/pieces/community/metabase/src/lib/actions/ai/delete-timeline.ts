import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseDeleteTimelineOutputSchema } from '../../output-schemas';

export const deleteTimelineAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_delete_timeline',
  outputSchema: metabaseDeleteTimelineOutputSchema,
  displayName: 'Delete Timeline',
  description: 'Permanently delete a timeline and its events.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a timeline and all its events. To hide it instead (recoverable), use Update Timeline with Archived = Yes.',
    idempotent: false,
  },
  props: {
    timelineId: metabaseAiProps.timelineId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await metabaseApi.deleteTimeline({
      auth,
      timelineId: propsValue.timelineId,
    });
    return { deleted: true, timelineId: propsValue.timelineId };
  },
});
