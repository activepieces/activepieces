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
  name: 'update_absence',
  classification: 'WRITE',
  displayName: 'Update Absence',
  description: 'Updates an absence in Clockodo',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.absence,
  aiMetadata: {
    description:
      'Modifies an existing Clockodo absence identified by absence_id, changing its date range, type, status (e.g. approve or decline a request), half-day flag, note, or sick-note flag. Use to amend or approve an absence rather than creating a new one (use Create Absence for new records). Idempotent: applying the same field values to the same absence_id converges to the same state.',
    idempotent: true,
  },
  props: {
    absence_id: Property.Number({
      displayName: 'Absence ID',
      description: 'Numeric ID of the absence (from Get Absences).',
      placeholder: 'e.g. 4410923',
      required: true,
    }),
    date_since: Property.DateTime({
      displayName: 'Start Date',
      description: 'First day of the absence.',
      required: false,
    }),
    date_until: Property.DateTime({
      displayName: 'End Date',
      description: 'Last day of the absence.',
      required: false,
    }),
    type: clockodoCommon.absenceType(false),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'New status of the absence. Clockodo allows only some transitions.',
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
      description: 'Tick to set to yes. Leaving it unticked changes nothing — use Half Days Status to set no.',
      required: false,
    }),
    half_days_status: clockodoCommon.keepYesNo({
      displayName: 'Half Days Status',
      description: 'Set to Yes or No. Keep or empty leaves it unchanged; overrides the checkbox above.',
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
    const id = clockodoRequests.parseId({ value: propsValue.absence_id, field: 'Absence ID' });
    const client = makeClient(auth.props);
    const half_days = clockodoRequests.checkboxOrStatus({ checkbox: propsValue.half_days, status: propsValue.half_days_status, field: 'Half Days Status' });
    return client.updateAbsence({
      id,
      request: clockodoRequests.absenceUpdateBody({
        date_since: reformatDate(propsValue.date_since),
        date_until: reformatDate(propsValue.date_until),
        type: propsValue.type ?? undefined,
        status: propsValue.status ?? undefined,
        half_days,
        note: emptyToNull(propsValue.note),
        sick_note: propsValue.sick_note ? true : undefined,
      }),
    });
  },
});
