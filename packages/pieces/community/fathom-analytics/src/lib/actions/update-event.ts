import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fathomAuth, FATHOM_API_BASE } from '../auth';

export const updateEvent = createAction({
  name: 'update_event',
  displayName: 'Update Event',
  description: 'Update an existing custom event (goal) for a specific site.',
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
    name: Property.ShortText({
      displayName: 'Event Name',
      description: 'The new name of the event/goal.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${FATHOM_API_BASE}/sites/${propsValue.site_id}/events/${propsValue.event_id}`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body: {
        name: propsValue.name,
      },
    });

    return response.body;
  },
});
