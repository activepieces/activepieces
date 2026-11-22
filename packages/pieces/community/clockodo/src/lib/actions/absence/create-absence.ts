import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { Property, createAction } from '@activepieces/pieces-framework';
import {
  clockodoCommon,
  emptyToNull,
  makeClient,
  reformatDate,
} from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'create_absence',
  classification: 'WRITE',
  displayName: 'Create Absence',
  description: 'Creates an absence in Clockodo',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.absence,
  aiMetadata: {
    description:
      'Creates a new Clockodo absence (e.g. vacation, sick leave) for a user over a start/end date range, with an absence type and optional approved/half-day/sick-note flags. Use to request or record time off; requires a date range and absence type, and defaults to the requested status unless approved is set. Not idempotent: each call creates a separate absence record.',
    idempotent: false,
  },
  props: {
    date_since: Property.DateTime({
      displayName: 'Start Date',
      description: 'First day of the absence.',
      required: true,
    }),
    date_until: Property.DateTime({
      displayName: 'End Date',
      description: 'Last day of the absence.',
      required: true,
    }),
    type: clockodoCommon.absenceType(true),
    user_id: clockodoCommon.user_id(false),
    half_days: Property.Checkbox({
      displayName: 'Half Days',
      description: 'Tick for a half-day absence (single day).',
      required: false,
    }),
    approved: Property.Checkbox({
      displayName: 'Approved',
      description: 'Record the absence as approved instead of requested (needs absence-manager rights).',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Optional internal note.',
      placeholder: 'e.g. Agreed by phone',
      required: false,
    }),
    sick_note: Property.Checkbox({
      displayName: 'Sick Note',
      description: 'Whether a sick note exists (not allowed for every absence type).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const date_since = clockodoRequests.requireValue({ value: reformatDate(propsValue.date_since), field: 'Start Date' });
    const date_until = clockodoRequests.requireValue({ value: reformatDate(propsValue.date_until), field: 'End Date' });
    const type = clockodoRequests.requireValue({ value: propsValue.type, field: 'Type' });
    return makeClient(auth.props).createAbsence(
      clockodoRequests.absenceCreateBody({
        date_since,
        date_until,
        type,
        users_id: clockodoRequests.parseOptionalId({ value: propsValue.user_id, field: 'User' }),
        half_days: propsValue.half_days,
        approved: propsValue.approved,
        note: emptyToNull(propsValue.note),
        sick_note: propsValue.sick_note ? true : undefined,
      })
    );
  },
});
