import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fathomAuth, FATHOM_API_BASE } from '../auth';

export const createEvent = createAction({
  name: 'create_event',
  displayName: 'Create Event',
  description: 'Create a custom event (goal) for a specific site.',
  audience: 'both',
  aiMetadata: { description: 'Create a new custom event (conversion goal) under a Fathom Analytics site, identified by site ID and a goal name. Use it to set up a goal before tracking conversions against it. Not idempotent — each call creates another event, so repeated calls with the same name can produce duplicates.', idempotent: false },
  auth: fathomAuth,
  props: {
    site_id: Property.ShortText({
      displayName: 'Site ID',
      description: 'The unique identifier for the Fathom site.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Event Name',
      description: 'The name of the event/goal (e.g., "Signup", "Purchase").',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await httpClient.sendRequest<{
      id: string;
      object: string;
      name: string;
      site_id: string;
      created_at: string;
    }>({
      method: HttpMethod.POST,
      url: `${FATHOM_API_BASE}/sites/${propsValue.site_id}/events`,
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
