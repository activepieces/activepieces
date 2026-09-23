import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyCollection, CalendlyRecord } from '../common';
import { eventTypesOutputSchema } from '../output-schemas';

export const listEventTypesAction = createAction({
  auth: calendlyAuth,
  name: 'list_event_types',
  classification: 'SEARCH',
  displayName: 'List Event Types',
  description: 'Lists the event types of a user or organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      "List Calendly event types (bookable meeting templates) with each URI, name, duration, kind, active flag and scheduling URL. Defaults to the connected user's event types; set Organization instead to list every event type in the organization (admin only). The returned uri is the Event Type value other actions need. Paginated with Page Token. Read-only.",
    idempotent: true,
  },
  outputSchema: eventTypesOutputSchema,
  props: {
    user: calendlyCommon.user,
    organization: Property.ShortText({
      displayName: 'Organization',
      description: 'Organization URI or UUID. When set, lists the whole organization instead of one user.',
      required: false,
    }),
    active: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Active only', value: 'true' },
          { label: 'Inactive only', value: 'false' },
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
      path: '/event_types',
      queryParams: {
        ...owner,
        active: propsValue.active,
        ...calendlyCommon.pageQuery({ count: propsValue.count, pageToken: propsValue.pageToken }),
      },
    });
    return calendlyCommon.toPage({ response });
  },
});
