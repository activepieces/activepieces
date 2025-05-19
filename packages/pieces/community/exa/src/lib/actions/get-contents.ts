import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { exaAuth } from '../../index';

export const getContentsAction = createAction({
  name: 'get_contents',
  displayName: 'Get Contents',
  description: 'Retrieve clean HTML content from specified URLs',
  auth: exaAuth,
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Webpage URL to extract content from',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/contents',
      { url: propsValue.url }
    );
  },
});
