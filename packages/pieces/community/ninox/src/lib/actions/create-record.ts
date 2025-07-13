import { createAction, Property } from '@activepieces/pieces-framework';
import { ninoxAuth } from '../../index';

export const createRecord = createAction({
  auth: ninoxAuth,
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Insert a new record into a specified Ninox table.',
  props: {
    databaseId: Property.ShortText({
      displayName: 'Database ID',
      required: true,
    }),
    tableId: Property.ShortText({
      displayName: 'Table ID',
      required: true,
    }),
    fields: Property.Object({
      displayName: 'Fields',
      description: 'Key-value pairs for the record fields',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    // TODO: Implement Ninox API call to create a record
    return { success: true, message: 'Stub: Record would be created here.' };
  },
}); 