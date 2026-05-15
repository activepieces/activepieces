import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fathomAuth, FATHOM_API_BASE } from '../auth';

export const updateSite = createAction({
  name: 'update_site',
  displayName: 'Update Site',
  description: 'Update an existing website in your Fathom account.',
  auth: fathomAuth,
  props: {
    site_id: Property.ShortText({
      displayName: 'Site ID',
      description: 'The unique identifier for the Fathom site.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Site Name',
      description: 'The new name of the website.',
      required: false,
    }),
    sharing: Property.StaticDropdown({
      displayName: 'Sharing',
      description: 'Whether the site data should be public or private.',
      required: false,
      options: {
        options: [
          { label: 'Private', value: 'none' },
          { label: 'Public', value: 'all' },
        ],
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${FATHOM_API_BASE}/sites/${propsValue.site_id}`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body: {
        name: propsValue.name,
        sharing: propsValue.sharing,
      },
    });

    return response.body;
  },
});
