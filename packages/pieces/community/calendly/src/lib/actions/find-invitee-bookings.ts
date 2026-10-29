import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyCollection, CalendlyRecord } from '../common';
import { findInviteeBookingsOutputSchema } from '../output-schemas';

export const findInviteeBookingsAction = createAction({
  auth: calendlyAuth,
  name: 'find_invitee_bookings',
  classification: 'SEARCH',
  displayName: 'Find Events by Invitee Email',
  description: "Finds the meetings an invitee booked with you, by the invitee's email.",
  audience: 'both',
  aiMetadata: {
    description:
      "Find the Calendly meetings a person booked with the connected user, by the invitee's email: up to the 100 most recent, newest first. Returns found=false when there are none. Read-only.",
    idempotent: true,
  },
  outputSchema: findInviteeBookingsOutputSchema,
  propertyGroups: [
    {
      key: 'search',
      display: 'section',
      label: 'Search',
      icon: 'filter',
      props: ['searchInfo', 'email', 'status'],
    },
  ],
  props: {
    searchInfo: Property.MarkDown({
      value: 'Returns up to 100 of your matching events, latest first.',
      variant: MarkdownVariant.INFO,
    }),
    email: Property.ShortText({
      displayName: 'Invitee Email',
      placeholder: 'jane@example.com',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Empty: both active and canceled.',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Canceled', value: 'canceled' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const user = await calendlyCommon.resolveUserUri({ token: auth.secret_text, user: undefined });
    const response = await calendlyCommon.calendlyRequest<CalendlyCollection<CalendlyRecord>>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: '/scheduled_events',
      queryParams: {
        user,
        invitee_email: propsValue.email.trim(),
        status: propsValue.status,
        sort: 'start_time:desc',
        count: '100',
      },
    });
    return {
      found: response.collection.length > 0,
      count: response.collection.length,
      events: response.collection,
    };
  },
});
