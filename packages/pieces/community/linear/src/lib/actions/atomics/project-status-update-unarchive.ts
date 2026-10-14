import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearMappers } from '../../common/mappers';
import { atomicStatusUpdates } from './common';
import { PROJECT_STATUS_UPDATE_UNARCHIVE_MUTATION } from './queries';
import { atomicArchivedProjectStatusUpdateOutputSchema } from './output-schemas';

export const linearProjectStatusUpdateUnarchiveAtomic = createAction({
  auth: linearAuth,
  name: 'linear_project_status_update_unarchive',
  classification: 'WRITE',
  displayName: 'Unarchive Project Status Update (AI)',
  description: 'Restore an archived project status update.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Restores an archived Linear project status update so it shows in the project Updates tab again. Use to undo Archive Project Status Update. Idempotent: restoring a visible update keeps it visible.',
    idempotent: true,
  },
  props: {
    status_update_id: Property.ShortText({ displayName: 'Status Update ID', description: 'UUID of the project status update.', required: true }),
  },
  outputSchema: atomicArchivedProjectStatusUpdateOutputSchema,
  async run({ auth, propsValue }) {
    const entity = await atomicStatusUpdates.setStatusUpdateArchived({
      auth,
      id: propsValue.status_update_id.trim(),
      archived: false,
      mutation: PROJECT_STATUS_UPDATE_UNARCHIVE_MUTATION,
      field: 'projectUpdateUnarchive',
    });
    return { success: true, ...linearMappers.flattenProjectStatusUpdate(entity) };
  },
});
