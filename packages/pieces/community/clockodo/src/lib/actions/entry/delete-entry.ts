import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient, deletedResult } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'delete_entry',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Entry',
  description: 'Deletes an entry in Clockodo',
  audience: 'both',
  outputSchema: clockodoOutputSchemas.deleted,
  aiMetadata: {
    description:
      'Permanently deletes a Clockodo time-record entry identified by its numeric entry_id. Use to remove a logged entry; locate the entry_id first via Get Entries if unknown. Not idempotent: a second call for the same id fails because the entry no longer exists.',
    idempotent: false,
  },
  props: {
    entry_id: Property.Number({
      displayName: 'Entry ID',
      description: 'Numeric ID of the time entry (from Get Entries).',
      placeholder: 'e.g. 158722301',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.entry_id, field: 'Entry ID' });
    await makeClient(auth.props).deleteEntry(id);
    return deletedResult(id);
  },
});
