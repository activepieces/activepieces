import { createAction, Property } from '@activepieces/pieces-framework';
import { ninoxAuth } from '../../index';

export const listFiles = createAction({
  auth: ninoxAuth,
  name: 'list_files',
  displayName: 'List Files from Record',
  description: 'List files attached to a specific Ninox record.',
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
  },
  async run({ auth, propsValue }) {
    // TODO: Implement Ninox API call to list files
    return { success: true, message: 'Stub: Files would be listed here.' };
  },
}); 