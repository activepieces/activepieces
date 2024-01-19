import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoAuth } from '../../../';

export default createAction({
  auth: clockodoAuth,
  name: 'delete_entry',
  displayName: 'Delete Entry',
  description: 'Deletes an entry in clockodo',
  props: {
    entry_id: Property.Number({
      displayName: 'Entry ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    await client.deleteEntry(propsValue.entry_id);
  },
});
