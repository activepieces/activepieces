import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetSegmentOutputSchema } from '../../output-schemas';

export const createSegmentAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_create_segment',
  outputSchema: metabaseGetSegmentOutputSchema,
  displayName: 'Create Segment',
  description: 'Create a segment (named filter) on a table.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a segment: a named filter on a table that users can reuse. Needs an admin key. Each call creates a new segment.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    definition: Property.Json({
      displayName: 'Definition',
      description:
        'The filter as a full MBQL query on one table, e.g. {"database": 1, "type": "query", "query": {"source-table": 2, "filter": ["=", ["field", 13, null], "Gizmo"]}}. Get table and field ids from Get Table Metadata.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.createSegment({
      auth,
      body: {
        name: propsValue.name,
        definition: propsValue.definition,
        description: propsValue.description,
      },
    });
  },
});
