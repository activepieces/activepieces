import { googleDriveAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { downloadFileFromDrive } from '../common/get-file-content';

export const readFile = createAction({
  auth: googleDriveAuth,
  name: 'read-file',
  displayName: 'Read File Content',
  description: 'Read a selected file from google drive file',
  audience: 'both',
  aiMetadata: { description: 'Downloads the content of a Drive file by its file ID and returns it as a usable file reference. Use to retrieve a file an agent already knows the ID of (e.g. from a trigger or search). Read-only and idempotent. Requires the exact file ID, not a name.', idempotent: true },
  props: {
    fileId: Property.ShortText({
      displayName: 'File ID',
      description: 'File ID coming from | New File -> id |',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'Destination File name',
      required: false,
    }),
  },
  run: async ({ auth, propsValue, files }) => {
    return downloadFileFromDrive(auth, files, propsValue.fileId, propsValue.fileName)
  },
});
