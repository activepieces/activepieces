import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearMappers } from '../../common/mappers';
import { atomicStatusUpdates } from './common';
import { PROJECT_STATUS_UPDATE_ARCHIVE_MUTATION } from './queries';
import { atomicArchivedProjectStatusUpdateOutputSchema } from './output-schemas';

export const linearProjectStatusUpdateArchiveAtomic = createAction({
  auth: linearAuth,
  name: 'linear_project_status_update_archive',
  classification: 'DESTRUCTIVE',
  displayName: 'Archive Project Status Update (AI)',
  description: 'Archive (hide) a project status update. It can be restored.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Archives a Linear project status update so it no longer shows in the project Updates tab; Unarchive Project Status Update restores it. Use to retract a report posted by mistake. Idempotent: archiving an archived update keeps it archived.',
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
      archived: true,
      mutation: PROJECT_STATUS_UPDATE_ARCHIVE_MUTATION,
      field: 'projectUpdateArchive',
    });
    return { success: true, ...linearMappers.flattenProjectStatusUpdate(entity) };
  },
});
