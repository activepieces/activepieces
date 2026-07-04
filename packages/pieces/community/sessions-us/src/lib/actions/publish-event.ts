import { baseUrl, getEvents } from '../common';
import { sessionAuth } from '../..';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

export const publishEvent = createAction({
  auth: sessionAuth,
  name: 'publish_event',
  displayName: 'Publish Event',
  description: 'Quickly publish an event.',
  audience: 'both',
  aiMetadata: { description: 'Publish an existing draft event on Sessions.us so it becomes live and open for registration, identified by its event id. Use after Create Event when the event should go public. Requires a valid event id; publishing an already-published event has no further effect, so the call is effectively idempotent.', idempotent: true },
  props: {
    event: Property.Dropdown({
      auth: sessionAuth,
      displayName: 'Event',
      description: 'The event you want to publish.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
          };
        }

        const events = await getEvents(auth.secret_text);
        return {
          options: events.map((event) => {
            return {
              label: event.session.name,
              value: event.id,
            };
          }),
        };
      },
    }),
  },

  async run({ propsValue, auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/events/${propsValue.event}/publish`,
      headers: {
        'x-api-key': auth.secret_text,
      },
    });
    return response.body;
  },
});
