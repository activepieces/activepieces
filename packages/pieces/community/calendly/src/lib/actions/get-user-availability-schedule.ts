import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyRecord } from '../common';
import { userAvailabilityScheduleOutputSchema } from '../output-schemas';

export const getUserAvailabilityScheduleAction = createAction({
  auth: calendlyAuth,
  name: 'get_user_availability_schedule',
  classification: 'READ',
  displayName: 'Get User Availability Schedule',
  description: 'Gets one user availability schedule.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get one Calendly user availability schedule by URI or UUID (from List User Availability Schedules): name, default flag, timezone and rules. Read-only.',
    idempotent: true,
  },
  outputSchema: userAvailabilityScheduleOutputSchema,
  props: {
    schedule: Property.ShortText({
      displayName: 'Availability Schedule',
      description: 'Availability schedule URI or UUID.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await calendlyCommon.calendlyRequest<{ resource: CalendlyRecord }>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: `/user_availability_schedules/${calendlyCommon.toUuid({ value: propsValue.schedule })}`,
    });
    return response.resource;
  },
});
