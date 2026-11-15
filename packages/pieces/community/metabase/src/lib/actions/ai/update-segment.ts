import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetSegmentOutputSchema } from '../../output-schemas';

export const updateSegmentAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_update_segment',
  outputSchema: metabaseGetSegmentOutputSchema,
  displayName: 'Update Segment',
  description: 'Change or archive a segment.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the fields you set on a segment, with a revision message kept in its history. Archived = Yes hides it (recoverable). Needs an admin key.',
    idempotent: true,
  },
  props: {
    segmentId: metabaseAiProps.segmentId({ required: true }),
    revisionMessage: Property.ShortText({
      displayName: 'Revision Message',
      description:
        'Why the change was made, kept in the history. Required by Metabase.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name. Empty = unchanged.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description. Empty = unchanged.',
      required: false,
    }),
    definition: Property.Json({
      displayName: 'Definition',
      description:
        'New filter definition (MBQL, same shape as Create Segment). Empty = unchanged.',
      required: false,
    }),
    archived: metabaseAiProps.yesNo({
      displayName: 'Archived',
      description:
        'Yes archives the segment, No restores it. Empty = unchanged.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.updateSegment({
      auth,
      segmentId: propsValue.segmentId,
      body: {
        revision_message: propsValue.revisionMessage,
        name: propsValue.name,
        description: propsValue.description,
        definition: propsValue.definition,
        archived: propsValue.archived,
      },
    });
  },
});
