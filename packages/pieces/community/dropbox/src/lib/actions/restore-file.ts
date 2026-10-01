import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { uploadedFileOutputSchema } from '../output-schemas';

export const dropboxRestoreFile = createAction({
  auth: dropboxAuth,
  name: 'restore_dropbox_file',
  classification: 'WRITE',
  displayName: 'Restore File Revision',
  description: 'Restore a file to a previous revision',
  audience: 'ai',
  aiMetadata: {
    description:
      'Restores a Dropbox file to a previous revision, obtained from List File Revisions. Use to undo an unwanted change while keeping the history intact. Not idempotent: each call writes a new revision, so repeating it adds further revisions rather than converging.',
    idempotent: false,
  },
  outputSchema: uploadedFileOutputSchema,
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'The file to restore, as a path (/folder/file.txt). This endpoint does not accept id: or rev: values.',
      required: true,
    }),
    rev: Property.ShortText({
      displayName: 'Revision',
      description:
        'The revision to restore the file to. Obtain it from List File Revisions.',
      required: true,
    }),
  },
  async run(context) {
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      path: '/files/restore',
      body: {
        path: context.propsValue.path,
        rev: context.propsValue.rev,
      },
    });
  },
});
