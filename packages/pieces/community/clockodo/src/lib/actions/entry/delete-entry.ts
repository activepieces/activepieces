import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'delete_entry',
  displayName: 'Delete Entry',
  description: 'Deletes an entry in clockodo',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a clockodo time-record entry identified by its numeric entry_id. Use to remove a logged entry; locate the entry_id first via Get Entries if unknown. Idempotent: the entry reaches the same deleted end state on repeated calls.',
    idempotent: true,
  },
  props: {
    entry_id: Property.Number({
      displayName: 'Entry ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth.props);
    await client.deleteEntry(propsValue.entry_id);
  },
});
