import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { scheduleActionOutputSchema } from '../output-schemas';

export const calcomCreateSchedule = createAction({
  auth: calcomAuth,
  name: 'calcom_create_schedule',
  classification: 'WRITE',
  displayName: 'Create Schedule',
  description: 'Create a new availability schedule.',
  audience: 'ai',
  outputSchema: scheduleActionOutputSchema,
  aiMetadata: {
    description:
      'Creates a new availability schedule with a weekly recurring pattern and optional date overrides. Setting Is Default to Yes replaces the user\'s current default schedule. Not idempotent: each call creates a new schedule, so retries duplicate.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    time_zone: Property.ShortText({
      displayName: 'Timezone',
      description: 'IANA timezone, e.g. Europe/Berlin. Get valid values from List Timezones.',
      required: true,
    }),
    is_default: Property.Checkbox({
      displayName: 'Is Default',
      description: 'Each user has exactly one default schedule; setting this replaces it.',
      required: true,
    }),
    availability: Property.Json({
      displayName: 'Availability',
      description:
        'Array of weekly availability blocks, e.g. [{"days": ["Monday", "Tuesday"], "startTime": "09:00", "endTime": "17:00"}]. Leave empty for Cal.com\'s default Mon-Fri 9-17 pattern.',
      required: false,
    }),
    overrides: Property.Json({
      displayName: 'Date Overrides',
      description: 'Array of date-specific overrides, e.g. [{"date": "2026-05-20", "startTime": "12:00", "endTime": "13:00"}].',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { name, time_zone, is_default, availability, overrides } = propsValue;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/schedules',
      version: calcomCommon.versions.schedules,
      body: {
        name,
        timeZone: time_zone,
        isDefault: is_default,
        ...(availability !== undefined ? { availability } : {}),
        ...(overrides !== undefined ? { overrides } : {}),
      },
    });
  },
});
