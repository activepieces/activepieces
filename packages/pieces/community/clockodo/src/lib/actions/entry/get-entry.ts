import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'get_entry',
  classification: 'READ',
  displayName: 'Get Entry',
  description: 'Retrieves a single entry from Clockodo',
  audience: 'both',
  outputSchema: clockodoOutputSchemas.entry,
  aiMetadata: {
    description:
      'Fetches one Clockodo time-record entry by its numeric entry_id and returns that entry. Use to read the current details of a known entry before updating or deleting it; to find entries by date range or customer instead, use Get Entries. Read-only and idempotent.',
    idempotent: true,
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
    return makeClient(auth.props).getEntry(id);
  },
});
