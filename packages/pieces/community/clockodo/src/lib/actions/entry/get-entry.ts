import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'get_entry',
  displayName: 'Get Entry',
  description: 'Retrieves a single entry from clockodo',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one clockodo time-record entry by its numeric entry_id and returns that entry. Use to read the current details of a known entry before updating or deleting it; to find entries by date range or customer instead, use Get Entries. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    entry_id: Property.Number({
      displayName: 'Entry ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient (auth.props);
    const res = await client.getEntry(propsValue.entry_id);
    return res.entry;
  },
});
