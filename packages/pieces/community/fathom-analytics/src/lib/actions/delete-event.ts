import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fathomAuth, FATHOM_API_BASE } from '../auth';

export const deleteEvent = createAction({
  name: 'delete_event',
  displayName: 'Delete Event',
  description: 'Delete a custom event (goal) from a specific site.',
  auth: fathomAuth,
  props: {
    site_id: Property.ShortText({
      displayName: 'Site ID',
      description: 'The unique identifier for the Fathom site.',
      required: true,
    }),
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description: 'The unique identifier for the Fathom event.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${FATHOM_API_BASE}/sites/${propsValue.site_id}/events/${propsValue.event_id}`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });

    return response.body;
  },
});
