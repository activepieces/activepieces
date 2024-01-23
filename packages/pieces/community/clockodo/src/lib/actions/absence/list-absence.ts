import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../../';

export default createAction({
  auth: clockodoAuth,
  name: 'list_absences',
  displayName: 'Get Absences',
  description: 'Fetches absences from clockodo',
  props: {
    year: Property.Number({
      displayName: 'Year',
      required: true,
    }),
    user_id: clockodoCommon.user_id(false),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    const res = await client.listAbsences({
      year: propsValue.year,
      users_id: propsValue.user_id,
    });
    return {
      absences: res.absences,
    };
  },
});
