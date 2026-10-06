import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyCollection, CalendlyRecord } from '../common';
import { eventInviteesOutputSchema } from '../output-schemas';

export const listEventInviteesAction = createAction({
  auth: calendlyAuth,
  name: 'list_event_invitees',
  classification: 'SEARCH',
  displayName: 'List Event Invitees',
  description: 'Lists the invitees of a booked meeting.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the invitees of one booked Calendly meeting with each invitee URI, name, email, status, timezone, answers to booking questions, no-show record and cancel/reschedule URLs. Filter by email or status. The invitee uri is what Mark Invitee as No Show needs. Paginated with Page Token. Read-only.',
    idempotent: true,
  },
  outputSchema: eventInviteesOutputSchema,
  props: {
    scheduledEvent: calendlyCommon.scheduledEvent,
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Canceled', value: 'canceled' },
        ],
      },
    }),
    count: calendlyCommon.count,
    pageToken: calendlyCommon.pageToken,
  },
  async run({ auth, propsValue }) {
    const response = await calendlyCommon.calendlyRequest<CalendlyCollection<CalendlyRecord>>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: `/scheduled_events/${calendlyCommon.toUuid({ value: propsValue.scheduledEvent })}/invitees`,
      queryParams: {
        email: propsValue.email?.trim(),
        status: propsValue.status,
        ...calendlyCommon.pageQuery({ count: propsValue.count, pageToken: propsValue.pageToken }),
      },
    });
    return calendlyCommon.toPage({ response });
  },
});
