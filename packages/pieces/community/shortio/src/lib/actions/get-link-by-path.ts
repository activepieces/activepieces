import { createAction, Property } from '@activepieces/pieces-framework';
import { shortioAuth, shortioCommon, shortioApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getLinkByPath = createAction({
  auth: shortioAuth,
  name: 'get_link_by_path',
  displayName: 'Get Link by Path',
  description: 'Retrieve link details using its path and domain.',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Domain hostname (e.g., ezhil.short.gy)',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Link path (e.g., resume, etc.)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const props = propsValue;
    
    const response = await shortioApiCall({
      apiKey: auth,
      method: HttpMethod.GET,
      resourceUri: '/links/expand',
      query: {
        domain: props.domain,
        path: props.path,
      },
    });

    return response;
  },
});
