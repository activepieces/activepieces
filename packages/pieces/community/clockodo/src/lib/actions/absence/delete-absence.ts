import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient, deletedResult } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'delete_absence',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Absence',
  description: 'Permanently deletes an absence in Clockodo. The absence must be declined or cancelled first (use Update Absence).',
  audience: 'both',
  outputSchema: clockodoOutputSchemas.deleted,
  aiMetadata: {
    description:
      'Permanently deletes a Clockodo absence identified by its numeric absence_id. Clockodo only deletes absences that are declined or cancelled; decline or cancel it with Update Absence first. Use to remove an absence record (e.g. a cancelled leave request); locate the absence_id first via Get Absences if unknown. Not idempotent: a second call for the same id fails because the absence no longer exists.',
    idempotent: false,
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
    await makeClient(auth.props).deleteAbsence(id);
    return deletedResult(id);
  },
});
