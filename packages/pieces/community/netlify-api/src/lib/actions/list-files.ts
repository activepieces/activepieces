import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const listFiles = createAction({
  name: 'list_files',
  displayName: 'List Files',
  description: 'Returns a list of all the files in the current deploy of a site',
  props: {
    site_id: Property.ShortText({
      displayName: 'Site ID',
      description: 'The unique identifier of the Netlify site',
      required: true
    })
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.netlify.com/api/v1/sites/${propsValue.site_id}/files`,
      headers: {
        'Authorization': `Bearer ${(auth as any).access_token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.body;
  }
});