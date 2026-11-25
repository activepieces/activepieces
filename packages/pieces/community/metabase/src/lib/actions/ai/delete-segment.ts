import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseDeleteSegmentOutputSchema } from '../../output-schemas';

export const deleteSegmentAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_delete_segment',
  outputSchema: metabaseDeleteSegmentOutputSchema,
  displayName: 'Delete Segment',
  description: 'Delete a segment.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Retires a segment, with a revision message kept in its history. Metabase archives rather than erases it: Get Segment still returns it with archived = true, and it no longer appears in List Segments or the query builder. Needs an admin key.',
    idempotent: false,
  },
  props: {
    segmentId: metabaseAiProps.segmentId({ required: true }),
    revisionMessage: Property.ShortText({
      displayName: 'Revision Message',
      description:
        'Why the change was made, kept in the history. Required by Metabase.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await metabaseApi.deleteSegment({
      auth,
      segmentId: propsValue.segmentId,
      revisionMessage: propsValue.revisionMessage,
    });
    return { deleted: true, segmentId: propsValue.segmentId };
  },
});
