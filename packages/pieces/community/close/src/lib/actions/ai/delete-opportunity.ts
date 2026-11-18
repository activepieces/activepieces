import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeOutputSchemas } from '../../common/output-schemas';

const deleteOpportunity = createAction({
  auth: closeAuth,
  name: 'delete_opportunity',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Opportunity',
  description: 'Permanently delete a opportunity.',
  audience: 'ai',
  aiMetadata: {
    description: 'Permanently deletes a Close opportunity by ID (oppo_...). This cannot be undone. Repeating it on a deleted opportunity returns not found.',
    idempotent: false,
  },
  outputSchema: closeOutputSchemas.deleted,
  props: {
    opportunityId: Property.ShortText({ displayName: 'Opportunity ID', description: 'oppo_...', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = closeClient.closeId({ value: propsValue.opportunityId, label: 'Opportunity ID', prefix: 'oppo' });
    await closeClient.request({ auth, method: HttpMethod.DELETE, path: `/opportunity/${closeClient.pathId(id)}/` });
    return { deleted: true, id };
  },
});

export { deleteOpportunity };
