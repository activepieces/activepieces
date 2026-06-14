import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'get_absence',
  displayName: 'Get Absence',
  description: 'Retrieves a single absence from clockodo',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one clockodo absence record by its numeric absence_id and returns that absence. Use to read the current details or status of a known absence before updating or deleting it; to find absences for a year instead, use Get Absences. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    absence_id: Property.Number({
      displayName: 'Absence ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth.props);
    const res = await client.getAbsence(propsValue.absence_id);
    return res.absence;
  },
});
