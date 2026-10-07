import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { listEventTypesActionOutputSchema } from '../output-schemas';

export const calcomListEventTypes = createAction({
  auth: calcomAuth,
  name: 'calcom_list_event_types',
  classification: 'SEARCH',
  displayName: 'List Event Types',
  description: 'List Cal.com event types, optionally filtered by owner.',
  audience: 'ai',
  outputSchema: listEventTypesActionOutputSchema,
  aiMetadata: {
    description:
      'Lists event types. With no filters, returns the event types owned by the connected API key. Use this to resolve an event type id before creating or updating a booking or event type.',
    idempotent: true,
  },
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Only event types owned by this Cal.com username. Leave empty to list your own.',
      required: false,
    }),
    event_slug: Property.ShortText({
      displayName: 'Event Slug',
      description: 'Filter to the event type with this exact slug. Requires Username to be set too.',
      required: false,
    }),
    org_slug: Property.ShortText({
      displayName: 'Organization Slug',
      description: 'Only used together with Username / Event Slug when booking through an organization.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { username, event_slug, org_slug } = propsValue;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/event-types',
      version: calcomCommon.versions.eventTypes,
      query: {
        username,
        eventSlug: event_slug,
        orgSlug: org_slug,
      },
    });
  },
});
