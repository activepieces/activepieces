import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetSegmentOutputSchema } from '../../output-schemas';

export const getSegmentAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_segment',
  outputSchema: metabaseGetSegmentOutputSchema,
  displayName: 'Get Segment',
  description: 'Get a segment by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one segment with its filter definition and table.',
    idempotent: true,
  },
  props: {
    segmentId: metabaseAiProps.segmentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getSegment({
      auth,
      segmentId: propsValue.segmentId,
    });
  },
});
