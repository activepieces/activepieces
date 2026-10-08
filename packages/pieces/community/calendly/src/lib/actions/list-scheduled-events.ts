import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyCollection, CalendlyRecord } from '../common';
import { scheduledEventsOutputSchema } from '../output-schemas';

export const listScheduledEventsAction = createAction({
  auth: calendlyAuth,
  name: 'list_scheduled_events',
  classification: 'SEARCH',
  displayName: 'List Scheduled Events',
  description: 'Lists booked Calendly meetings.',
  audience: 'ai',
  aiMetadata: {
    description:
      "List booked Calendly meetings with each URI, name, status, start and end time, event type, location and invitee counts. Defaults to the connected user's meetings; set Organization to list the whole organization (admin only). Filter by invitee email, status and a start-time range (UTC ISO 8601). Invitees are not included; use List Event Invitees. Paginated with Page Token. Read-only.",
    idempotent: true,
  },
  outputSchema: scheduledEventsOutputSchema,
  props: {
    user: calendlyCommon.user,
    organization: Property.ShortText({
      displayName: 'Organization',
      description: 'Organization URI or UUID. When set, lists the whole organization instead of one user.',
      required: false,
    }),
    inviteeEmail: Property.ShortText({
      displayName: 'Invitee Email',
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
    minStartTime: Property.DateTime({
      displayName: 'Starts After',
      required: false,
    }),
    maxStartTime: Property.DateTime({
      displayName: 'Starts Before',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      required: false,
      defaultValue: 'start_time:asc',
      options: {
        options: [
          { label: 'Start time, earliest first', value: 'start_time:asc' },
          { label: 'Start time, latest first', value: 'start_time:desc' },
        ],
      },
    }),
    count: calendlyCommon.count,
    pageToken: calendlyCommon.pageToken,
  },
  async run({ auth, propsValue }) {
    const owner = calendlyCommon.isProvided(propsValue.organization)
      ? { organization: calendlyCommon.toUri({ resource: 'organizations', value: propsValue.organization }) }
      : { user: await calendlyCommon.resolveUserUri({ token: auth.secret_text, user: propsValue.user }) };
    const response = await calendlyCommon.calendlyRequest<CalendlyCollection<CalendlyRecord>>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: '/scheduled_events',
      queryParams: {
        ...owner,
        invitee_email: propsValue.inviteeEmail?.trim(),
        status: propsValue.status,
        min_start_time: propsValue.minStartTime,
        max_start_time: propsValue.maxStartTime,
        sort: propsValue.sort,
        ...calendlyCommon.pageQuery({ count: propsValue.count, pageToken: propsValue.pageToken }),
      },
    });
    return calendlyCommon.toPage({ response });
  },
});
