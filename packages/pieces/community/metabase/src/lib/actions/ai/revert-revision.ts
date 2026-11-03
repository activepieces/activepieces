import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseRevertRevisionOutputSchema } from '../../output-schemas';

export const revertRevisionAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_revert_revision',
  outputSchema: metabaseRevertRevisionOutputSchema,
  displayName: 'Revert Revision',
  description: 'Restore an item to an earlier revision.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Restores a question, dashboard, document or segment to an earlier revision from List Revisions. The revert is itself recorded as a new revision.',
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
    revisionId: Property.Number({
      displayName: 'Revision ID',
      description: 'The revision to restore, from List Revisions.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.revertRevision({
      auth,
      body: {
        entity: propsValue.entity,
        id: propsValue.entityId,
        revision_id: propsValue.revisionId,
      },
    });
  },
});
