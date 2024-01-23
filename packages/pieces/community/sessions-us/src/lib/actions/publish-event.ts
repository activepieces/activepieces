import { baseUrl, getEvents } from '../common';
import { sessionAuth } from '../..';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

export const publishEvent = createAction({
  auth: sessionAuth,
  name: 'publish_event',
  displayName: 'Publish Event',
  description: 'Quickly publish an event.',
  props: {
    event: Property.Dropdown({
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

        const events = await getEvents(auth as string);
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
        'x-api-key': auth,
      },
    });
    return response.body;
  },
});
