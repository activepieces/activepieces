import { createAction, Property } from '@activepieces/pieces-framework';
import { ninoxAuth } from '../../index';

export const uploadFile = createAction({
  auth: ninoxAuth,
  name: 'upload_file',
  displayName: 'Upload File',
  description: 'Attach a file to a Ninox record.',
  props: {
    databaseId: Property.ShortText({
      displayName: 'Database ID',
      required: true,
    }),
    tableId: Property.ShortText({
      displayName: 'Table ID',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      required: true,
    }),
  },
  async run({ auth, propsValue, files }) {
    // TODO: Implement Ninox API call to upload a file
    return { success: true, message: 'Stub: File would be uploaded here.' };
  },
}); 