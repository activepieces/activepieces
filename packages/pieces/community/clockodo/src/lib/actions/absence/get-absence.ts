import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'get_absence',
  classification: 'READ',
  displayName: 'Get Absence',
  description: 'Retrieves a single absence from Clockodo',
  audience: 'both',
  outputSchema: clockodoOutputSchemas.absence,
  aiMetadata: {
    description:
      'Fetches one Clockodo absence record by its numeric absence_id and returns that absence. Use to read the current details or status of a known absence before updating or deleting it; to find absences for a year instead, use Get Absences. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    absence_id: Property.Number({
      displayName: 'Absence ID',
      description: 'Numeric ID of the absence (from Get Absences).',
      placeholder: 'e.g. 4410923',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.absence_id, field: 'Absence ID' });
    return makeClient(auth.props).getAbsence(id);
  },
});
