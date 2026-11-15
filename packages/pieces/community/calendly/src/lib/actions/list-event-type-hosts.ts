import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyCollection, CalendlyRecord } from '../common';
import { eventTypeHostsOutputSchema } from '../output-schemas';

export const listEventTypeHostsAction = createAction({
  auth: calendlyAuth,
  name: 'list_event_type_hosts',
  classification: 'SEARCH',
  displayName: 'List Event Type Hosts',
  description: 'Lists the hosts of an event type.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the hosts (members) of one Calendly event type, each with the member user URI, name and email. Useful for group, collective and round-robin event types. Paginated with Page Token. Read-only.',
    idempotent: true,
  },
  outputSchema: eventTypeHostsOutputSchema,
  props: {
    eventType: calendlyCommon.eventType,
    count: calendlyCommon.count,
    pageToken: calendlyCommon.pageToken,
  },
  async run({ auth, propsValue }) {
    const response = await calendlyCommon.calendlyRequest<CalendlyCollection<CalendlyRecord>>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: '/event_type_memberships',
      queryParams: {
        event_type: calendlyCommon.toUri({ resource: 'event_types', value: propsValue.eventType }),
        ...calendlyCommon.pageQuery({ count: propsValue.count, pageToken: propsValue.pageToken }),
      },
    });
    return calendlyCommon.toPage({ response });
  },
});
