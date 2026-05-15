import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fathomAuth, FATHOM_API_BASE } from '../auth';

export const deleteSite = createAction({
  name: 'delete_site',
  displayName: 'Delete Site',
  description: 'Delete a website from your Fathom account.',
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
      method: HttpMethod.DELETE,
      url: `${FATHOM_API_BASE}/sites/${propsValue.site_id}`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });

    return response.body;
  },
});
