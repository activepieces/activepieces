import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoAuth } from '../../../';

export default createAction({
  auth: clockodoAuth,
  name: 'get_entry',
  displayName: 'Get Entry',
  description: 'Retrieves a single entry from clockodo',
  props: {
    entry_id: Property.Number({
      displayName: 'Entry ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    const res = await client.getEntry(propsValue.entry_id);
    return res.entry;
  },
});
