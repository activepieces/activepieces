import { createAction, Property } from '@activepieces/pieces-framework';
import { ninoxAuth } from '../../index';

export const findRecord = createAction({
  auth: ninoxAuth,
  name: 'find_record',
  displayName: 'Find Record',
  description: 'Search for a record by field values in Ninox.',
  props: {
    databaseId: Property.ShortText({
      displayName: 'Database ID',
      required: true,
    }),
    tableId: Property.ShortText({
      displayName: 'Table ID',
      required: true,
    }),
    searchFields: Property.Object({
      displayName: 'Search Fields',
      description: 'Key-value pairs to search for',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    // TODO: Implement Ninox API call to find a record
    return { success: true, message: 'Stub: Record would be searched here.' };
  },
}); 