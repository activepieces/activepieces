import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyCollection, CalendlyRecord } from '../common';
import { userAvailabilitySchedulesOutputSchema } from '../output-schemas';

export const listUserAvailabilitySchedulesAction = createAction({
  auth: calendlyAuth,
  name: 'list_user_availability_schedules',
  classification: 'SEARCH',
  displayName: 'List User Availability Schedules',
  description: "Lists a user's availability schedules.",
  audience: 'ai',
  aiMetadata: {
    description:
      "List a Calendly user's availability schedules (working hours), each with URI, name, default flag, timezone and weekday/date rules. Defaults to the connected user. Not paginated. Read-only.",
    idempotent: true,
  },
  outputSchema: userAvailabilitySchedulesOutputSchema,
  props: {
    user: calendlyCommon.user,
  },
  async run({ auth, propsValue }) {
    const user = await calendlyCommon.resolveUserUri({ token: auth.secret_text, user: propsValue.user });
    const response = await calendlyCommon.calendlyRequest<CalendlyCollection<CalendlyRecord>>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: '/user_availability_schedules',
      queryParams: { user },
    });
    return { items: response.collection, count: response.collection.length };
  },
});
