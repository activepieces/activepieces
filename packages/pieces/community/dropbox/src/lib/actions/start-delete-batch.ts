import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { deleteBatchLaunchOutputSchema } from '../output-schemas';

export const dropboxStartDeleteBatch = createAction({
  auth: dropboxAuth,
  name: 'start_dropbox_delete_batch',
  classification: 'DESTRUCTIVE',
  displayName: 'Start Delete Batch',
  description: 'Delete many files or folders in one job',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts a job deleting up to 1000 Dropbox files or folders in one call. Deleted entries go to trash and remain restorable, they are not erased. Small batches complete immediately; larger ones return an async job id that Get Delete Batch Status polls. Not idempotent: a second call fails on paths already deleted.',
    idempotent: false,
  },
  outputSchema: deleteBatchLaunchOutputSchema,
  props: {
    paths: Property.Array({
      displayName: 'Paths',
      description:
        'The entries to delete, at most 1000. Each accepts a path (/folder/file.txt) or an id (id:abc123).',
      required: true,
    }),
  },
  async run(context) {
    const paths = context.propsValue.paths as string[];
    if (paths.length === 0) {
      throw new Error('Provide at least one path to delete.');
    }
    if (paths.length > 1000) {
      throw new Error('Dropbox accepts at most 1000 entries per delete batch.');
    }
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      path: '/files/delete_batch',
      body: { entries: paths.map((path) => ({ path })) },
    });
  },
});
