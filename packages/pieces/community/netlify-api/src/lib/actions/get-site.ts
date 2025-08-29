import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getSite = createAction({
  name: 'get_site',
  displayName: 'Get Site Deploy',
  description: 'Get a specified site deployment with all its details',
  props: {
    site_id: Property.ShortText({
      displayName: 'Site ID',
      description: 'The unique identifier of the Netlify site',
      required: true
    }),
    deploy_id: Property.ShortText({
      displayName: 'Deploy ID',
      description: 'The unique identifier of the deployment',
      required: true
    })
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.netlify.com/api/v1/sites/${propsValue.site_id}/deploys/${propsValue.deploy_id}`,
      headers: {
        Authorization: `Bearer ${(auth as any).access_token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.body;
  }
});
