import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { createFolderBatchLaunchOutputSchema } from '../output-schemas';

export const dropboxStartCreateFolderBatch = createAction({
  auth: dropboxAuth,
  name: 'start_dropbox_create_folder_batch',
  classification: 'WRITE',
  displayName: 'Start Create Folder Batch',
  description: 'Create many folders in one job',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts a job creating up to 10000 Dropbox folders in one call. Small batches complete immediately; larger ones return an async job id that Get Create Folder Batch Status polls. Not idempotent: without autorename a second call conflicts on folders that already exist.',
    idempotent: false,
  },
  outputSchema: createFolderBatchLaunchOutputSchema,
  props: {
    paths: Property.Array({
      displayName: 'Paths',
      description:
        'The folders to create, at most 10000. Each must be a path such as /reports/2026; this endpoint does not accept id: values.',
      required: true,
    }),
    autorename: Property.Checkbox({
      displayName: 'Auto Rename',
      description: 'Let Dropbox rename a folder when its path conflicts.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const paths = context.propsValue.paths as string[];
    if (paths.length === 0) {
      throw new Error('Provide at least one folder path to create.');
    }
    if (paths.length > 10000) {
      throw new Error(
        'Dropbox accepts at most 10000 folders per create folder batch.'
      );
    }
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      path: '/files/create_folder_batch',
      body: {
        paths,
        autorename: context.propsValue.autorename ?? false,
      },
    });
  },
});
