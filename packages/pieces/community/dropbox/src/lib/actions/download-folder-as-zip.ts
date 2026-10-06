import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { zipDownloadOutputSchema } from '../output-schemas';

export const dropboxDownloadFolderAsZip = createAction({
  auth: dropboxAuth,
  name: 'download_dropbox_folder_as_zip',
  classification: 'READ',
  displayName: 'Download Folder as Zip',
  description: 'Download a folder as a zip archive',
  audience: 'ai',
  aiMetadata: {
    description:
      'Downloads an entire Dropbox folder as a single zip archive and returns it as a file object. Use to retrieve a whole folder in one step instead of listing it and downloading each file. The folder must be under 20 GB and contain fewer than 10,000 files. Read-only.',
    idempotent: true,
  },
  outputSchema: zipDownloadOutputSchema,
  props: {
    path: Property.ShortText({
      displayName: 'Folder Path',
      description:
        'The folder to download (e.g. /reports). Accepts a path, an id (id:abc123) or a revision (rev:a1c10ce0dd78).',
      required: true,
    }),
  },
  async run(context) {
    const folderName =
      (context.propsValue.path.match(/[^/]+$/) ?? ['dropbox-folder'])[0];
    const { data, result } = await dropboxCommon.download<{
      metadata?: unknown;
    }>({
      auth: context.auth.access_token,
      path: '/files/download_zip',
      arg: { path: context.propsValue.path },
    });
    return {
      file: await context.files.write({
        fileName: `${folderName}.zip`,
        data,
      }),
      metadata: result?.metadata,
    };
  },
});
