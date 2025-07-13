import { createAction, Property } from '@activepieces/pieces-framework';
import { ninoxAuth } from '../../index';

export const downloadFile = createAction({
  auth: ninoxAuth,
  name: 'download_file',
  displayName: 'Download File from Record',
  description: 'Download a file attached to a Ninox record.',
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
    fileId: Property.ShortText({
      displayName: 'File ID',
      required: true,
    }),
  },
  async run({ auth, propsValue, files }) {
    // TODO: Implement Ninox API call to download a file
    return { success: true, message: 'Stub: File would be downloaded here.' };
  },
}); 