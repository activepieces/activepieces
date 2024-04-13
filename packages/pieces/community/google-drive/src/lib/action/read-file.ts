import { googleDriveAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { downloadFileFromDrive } from '../common/get-file-content';

export const readFile = createAction({
  auth: googleDriveAuth,
  name: 'read-file',
  displayName: 'Read file',
  description: 'Read a selected file from google drive file',
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
