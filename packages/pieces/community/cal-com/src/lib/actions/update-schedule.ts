import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { scheduleActionOutputSchema } from '../output-schemas';

function toOptionalBoolean(value: string | undefined): boolean | undefined {
  return value === undefined ? undefined : value === 'true';
}

export const calcomUpdateSchedule = createAction({
  auth: calcomAuth,
  name: 'calcom_update_schedule',
  classification: 'WRITE',
  displayName: 'Update Schedule',
  description: 'Update an existing availability schedule. Only the fields you set are changed.',
  audience: 'ai',
  outputSchema: scheduleActionOutputSchema,
  aiMetadata: {
    description:
      'Partially updates a schedule by id: an omitted field keeps its current value, except Availability and Date Overrides, which are fully replaced (not merged) when supplied — read the current schedule with Get Schedule first if you need to change one block while keeping the rest. Idempotent: repeating with the same input yields the same final state.',
    idempotent: true,
  },
  props: {
    schedule_id: Property.Number({
      displayName: 'Schedule ID',
      description: 'Get this from List Schedules.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    time_zone: Property.ShortText({
      displayName: 'Timezone',
      required: false,
    }),
    is_default: Property.StaticDropdown({
      displayName: 'Is Default',
      description: 'Leave unset to keep the current default schedule unchanged.',
      required: false,
      options: {
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
    availability: Property.Json({
      displayName: 'Availability (full replacement)',
      description: 'If set, replaces the entire weekly availability array, e.g. [{"days": ["Monday"], "startTime": "09:00", "endTime": "17:00"}].',
      required: false,
    }),
    overrides: Property.Json({
      displayName: 'Date Overrides (full replacement)',
      description: 'If set, replaces the entire date-overrides array, e.g. [{"date": "2026-05-20", "startTime": "12:00", "endTime": "13:00"}].',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { schedule_id, name, time_zone, is_default, availability, overrides } = propsValue;

    const body: Record<string, unknown> = {};
    if (name !== undefined) body['name'] = name;
    if (time_zone !== undefined) body['timeZone'] = time_zone;
    const isDefaultValue = toOptionalBoolean(is_default);
    if (isDefaultValue !== undefined) body['isDefault'] = isDefaultValue;
    if (availability !== undefined) body['availability'] = availability;
    if (overrides !== undefined) body['overrides'] = overrides;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.PATCH,
      path: `/schedules/${schedule_id}`,
      version: calcomCommon.versions.schedules,
      body,
    });
  },
});
