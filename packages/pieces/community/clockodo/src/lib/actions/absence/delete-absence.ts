import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'delete_absence',
  displayName: 'Delete Absence',
  description: 'Deletes an absence in clockodo',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a clockodo absence identified by its numeric absence_id. Use to remove an absence record (e.g. a cancelled leave request); locate the absence_id first via Get Absences if unknown. Idempotent: the absence reaches the same deleted end state on repeated calls.',
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
    await client.deleteAbsence(propsValue.absence_id);
  },
});
