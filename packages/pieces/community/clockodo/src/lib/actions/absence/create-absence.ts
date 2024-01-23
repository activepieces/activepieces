import { Property, createAction } from '@activepieces/pieces-framework';
import {
  clockodoCommon,
  emptyToNull,
  makeClient,
  reformatDate,
} from '../../common';
import { AbsenceStatus, AbsenceType } from '../../common/models/absence';
import { clockodoAuth } from '../../../';

export default createAction({
  auth: clockodoAuth,
  name: 'create_absence',
  displayName: 'Create Absence',
  description: 'Creates a absence in clockodo',
  props: {
    date_since: Property.DateTime({
      displayName: 'Start Date',
      required: true,
    }),
    date_until: Property.DateTime({
      displayName: 'End Date',
      required: true,
    }),
    type: clockodoCommon.absenceType(true),
    user_id: clockodoCommon.user_id(false),
    half_days: Property.Checkbox({
      displayName: 'Half Days',
      required: false,
    }),
    approved: Property.Checkbox({
      displayName: 'Approved',
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
    const res = await client.createAbsence({
      date_since: reformatDate(propsValue.date_since) as string,
      date_until: reformatDate(propsValue.date_until) as string,
      type: propsValue.type as AbsenceType,
      users_id: propsValue.user_id,
      count_days: propsValue.half_days ? 0.5 : 1,
      status: propsValue.approved
        ? AbsenceStatus.APPROVED
        : AbsenceStatus.REQUESTED,
      note: emptyToNull(propsValue.note),
      sick_note: propsValue.sick_note,
    });
    return res.absence;
  },
});
