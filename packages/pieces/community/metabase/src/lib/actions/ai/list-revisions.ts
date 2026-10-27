import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListRevisionsOutputSchema } from '../../output-schemas';

export const listRevisionsAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_revisions',
  outputSchema: metabaseListRevisionsOutputSchema,
  displayName: 'List Revisions',
  description: 'List the change history of an item.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the revision history of a question, dashboard, document or segment: who changed what and when, with revision ids for Revert Revision.',
    idempotent: true,
  },
  props: {
    entity: Property.StaticDropdown({
      displayName: 'Item Type',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Question', value: 'card' },
          { label: 'Dashboard', value: 'dashboard' },
          { label: 'Document', value: 'document' },
          { label: 'Segment', value: 'segment' },
        ],
      },
    }),
    entityId: Property.Number({
      displayName: 'Item ID',
      description: 'Numeric ID of the item.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const revisions = await metabaseApi.listRevisions({
      auth,
      entity: propsValue.entity,
      entityId: propsValue.entityId,
    });
    return { revisions, count: revisions.length };
  },
});
