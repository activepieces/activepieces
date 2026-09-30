import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyRecord } from '../common';
import { shareOutputSchema } from '../output-schemas';

export const createShareAction = createAction({
  auth: calendlyAuth,
  name: 'create_share',
  classification: 'WRITE',
  displayName: 'Create Customized Share Link',
  description: 'Creates a booking link that overrides some settings of a one-on-one event type.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a customized one-time share of a one-on-one (solo) Calendly event type, overriding its name, duration or booking window without changing the event type itself. Returns scheduling_links with the booking_url to send. Only one-on-one event types can be shared. Not idempotent: each call creates a new share.',
    idempotent: false,
  },
  outputSchema: shareOutputSchema,
  props: {
    eventType: calendlyCommon.eventType,
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    duration: Property.Number({
      displayName: 'Duration (minutes)',
      required: false,
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'First bookable date, YYYY-MM-DD. Set together with End Date to limit the booking window.',
      required: false,
    }),
    endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'Last bookable date, YYYY-MM-DD.',
      required: false,
    }),
    hideLocation: Property.Checkbox({
      displayName: 'Hide Location Until Booked',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const hasStartDate = calendlyCommon.isProvided(propsValue.startDate);
    const hasEndDate = calendlyCommon.isProvided(propsValue.endDate);
    if (hasStartDate !== hasEndDate) {
      throw new Error('Set both Start Date and End Date to limit the booking window, or leave both empty.');
    }
    const hasWindow = hasStartDate && hasEndDate;
    const response = await calendlyCommon.calendlyRequest<{ resource: CalendlyRecord }>({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: '/shares',
      body: {
        event_type: calendlyCommon.toUri({ resource: 'event_types', value: propsValue.eventType }),
        ...(calendlyCommon.isProvided(propsValue.name) ? { name: propsValue.name } : {}),
        ...(propsValue.duration !== undefined && propsValue.duration !== null
          ? { duration: propsValue.duration }
          : {}),
        ...(hasWindow
          ? { period_type: 'fixed', start_date: propsValue.startDate?.trim(), end_date: propsValue.endDate?.trim() }
          : {}),
        ...(propsValue.hideLocation ? { hide_location: true } : {}),
      },
    });
    return response.resource;
  },
});
