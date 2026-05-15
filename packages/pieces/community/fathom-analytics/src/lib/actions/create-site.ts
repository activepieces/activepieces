import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fathomAuth, FATHOM_API_BASE } from '../auth';

export const createSite = createAction({
  name: 'create_site',
  displayName: 'Create Site',
  description: 'Create a new website in your Fathom account.',
  auth: fathomAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Site Name',
      description: 'The name of the website.',
      required: true,
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
      url: `${FATHOM_API_BASE}/sites`,
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
