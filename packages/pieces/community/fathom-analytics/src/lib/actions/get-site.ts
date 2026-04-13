import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fathomAuth, FATHOM_API_BASE } from '../auth';

export const getSite = createAction({
  name: 'get_site',
  displayName: 'Get Site',
  description: 'Retrieve details for a specific site by its ID.',
  auth: fathomAuth,
  props: {
    site_id: Property.ShortText({
      displayName: 'Site ID',
      description: 'The unique identifier for the Fathom site (e.g., CDBUGS).',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await httpClient.sendRequest<{
      id: string;
      object: string;
      name: string;
      sharing: string;
      created_at: string;
    }>({
      method: HttpMethod.GET,
      url: `${FATHOM_API_BASE}/sites/${propsValue.site_id}`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });

    return response.body;
  },
});
