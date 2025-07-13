import { createAction, Property } from '@activepieces/pieces-framework';
import { ninoxAuth } from '../../index';

export const deleteRecord = createAction({
  auth: ninoxAuth,
  name: 'delete_record',
  displayName: 'Delete Record',
  description: 'Remove a record from a Ninox table.',
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
    // TODO: Implement Ninox API call to delete a record
    return { success: true, message: 'Stub: Record would be deleted here.' };
  },
}); 