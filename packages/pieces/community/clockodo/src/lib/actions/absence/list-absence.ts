import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'list_absences',
  displayName: 'Get Absences',
  description: 'Fetches absences from clockodo',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches clockodo absence records for a required calendar year, optionally filtered to a single user. Use to list or report on time off within a year; to read one absence by id instead, use Get Absence. Read-only and idempotent.',
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
    const client = makeClient(auth.props);
    const res = await client.listAbsences({
      year: propsValue.year,
      users_id: propsValue.user_id,
    });
    return {
      absences: res.absences,
    };
  },
});
