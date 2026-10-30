import { createAction } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListSegmentsOutputSchema } from '../../output-schemas';

export const listSegmentsAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_segments',
  outputSchema: metabaseListSegmentsOutputSchema,
  displayName: 'List Segments',
  description: 'List saved segments (named filters).',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists segments: named, reusable filter definitions on a table, with their ids and table ids.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const segments = await metabaseApi.listSegments({
      auth,
    });
    return { segments, count: segments.length };
  },
});
