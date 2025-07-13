import { createAction, Property } from '@activepieces/pieces-framework';
import { ninoxAuth } from '../../index';

export const updateRecord = createAction({
  auth: ninoxAuth,
  name: 'update_record',
  displayName: 'Update Record',
  description: 'Update fields on an existing Ninox record.',
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
    fields: Property.Object({
      displayName: 'Fields',
      description: 'Key-value pairs for the record fields to update',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    // TODO: Implement Ninox API call to update a record
    return { success: true, message: 'Stub: Record would be updated here.' };
  },
}); 