import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fathomAuth, FATHOM_API_BASE } from '../auth';

export const wipeSite = createAction({
  name: 'wipe_site',
  displayName: 'Wipe Site',
  description: 'Delete all data (pageviews and events) for a specific site.',
  auth: fathomAuth,
  props: {
    site_id: Property.ShortText({
      displayName: 'Site ID',
      description: 'The unique identifier for the Fathom site.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${FATHOM_API_BASE}/sites/${propsValue.site_id}/wipe`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });

    return response.body;
  },
});
