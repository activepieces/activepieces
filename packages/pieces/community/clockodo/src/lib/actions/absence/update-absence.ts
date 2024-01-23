import { Property, createAction } from '@activepieces/pieces-framework';
import {
  clockodoCommon,
  emptyToNull,
  makeClient,
  reformatDate,
} from '../../common';
import { clockodoAuth } from '../../../';

export default createAction({
  auth: clockodoAuth,
  name: 'update_absence',
  displayName: 'Update Absence',
  description: 'Updates an absence in clockodo',
  props: {
    absence_id: Property.Number({
      displayName: 'Absence ID',
      required: true,
    }),
    date_since: Property.DateTime({
      displayName: 'Start Date',
      required: false,
    }),
    date_until: Property.DateTime({
      displayName: 'End Date',
      required: false,
    }),
    type: clockodoCommon.absenceType(false),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { value: 0, label: 'Requested' },
          { value: 1, label: 'Approved' },
          { value: 2, label: 'Declined' },
          { value: 3, label: 'Approval cancelled' },
          { value: 4, label: 'Request cancelled' },
        ],
      },
    }),
    half_days: Property.Checkbox({
      displayName: 'Half Days',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      required: false,
    }),
    sick_note: Property.Checkbox({
      displayName: 'Sick Note',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    const res = await client.updateAbsence(propsValue.absence_id, {
      date_since: reformatDate(propsValue.date_since),
      date_until: reformatDate(propsValue.date_until),
      type: propsValue.type,
      status: propsValue.status,
      count_days: propsValue.half_days ? 0.5 : 1,
      note: emptyToNull(propsValue.note),
      sick_note: propsValue.sick_note,
    });
    return res.absence;
  },
});
