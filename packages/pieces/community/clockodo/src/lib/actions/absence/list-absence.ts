import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'list_absences',
  classification: 'SEARCH',
  displayName: 'Get Absences',
  description: 'Fetches absences from Clockodo',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.absences,
  aiMetadata: {
    description:
      'Fetches Clockodo absence records for a required calendar year, optionally filtered to a single user. Use to list or report on time off within a year; to read one absence by id instead, use Get Absence. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    year: Property.Number({
      displayName: 'Year',
      required: true,
    }),
    user_id: clockodoCommon.user_id(false),
  },
  async run({ auth, propsValue }) {
    const absences = await makeClient(auth.props).listAbsences({
      year: clockodoRequests.parseYear({ value: propsValue.year, field: 'Year' }),
      users_id: clockodoRequests.parseOptionalId({ value: propsValue.user_id, field: 'User' }),
    });
    return {
      absences,
    };
  },
});
