import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyRecord } from '../common';
import { updateEventTypeAvailabilityOutputSchema } from '../output-schemas';

export const updateEventTypeAvailabilityAction = createAction({
  auth: calendlyAuth,
  name: 'update_event_type_availability',
  classification: 'WRITE',
  displayName: 'Update Event Type Availability',
  description: 'Replaces the availability schedule of an event type.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Replace the availability schedule of one Calendly event type. Rules REPLACES every existing rule, so first call Get Event Type Availability, change the rules you need and send back the full list. Each rule is {"type":"wday","wday":"monday","intervals":[{"from":"09:00","to":"17:00"}]} or {"type":"date","date":"2026-12-24","intervals":[]} (empty intervals = unavailable that day).',
    idempotent: true,
  },
  outputSchema: updateEventTypeAvailabilityOutputSchema,
  props: {
    eventType: calendlyCommon.eventType,
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'IANA timezone such as America/New_York.',
      required: true,
    }),
    rules: Property.Json({
      displayName: 'Rules',
      description:
        'Full list of rules, replacing the current ones. Example: [{"type":"wday","wday":"monday","intervals":[{"from":"09:00","to":"17:00"}]}]',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const rules: unknown = propsValue.rules;
    if (!Array.isArray(rules)) {
      throw new Error('Rules must be a JSON array of availability rules.');
    }
    const response = await calendlyCommon.calendlyRequest<{ resource: CalendlyRecord }>({
      token: auth.secret_text,
      method: HttpMethod.PATCH,
      path: '/event_type_availability_schedules',
      queryParams: {
        event_type: calendlyCommon.toUri({ resource: 'event_types', value: propsValue.eventType }),
      },
      body: {
        availability_rule: { timezone: propsValue.timezone.trim(), rules },
      },
    });
    return response.resource;
  },
});
