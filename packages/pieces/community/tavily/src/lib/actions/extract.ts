import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { tavilyAuth } from '../../index';

export const extractAction = createAction({
  name: 'extract',
  displayName: 'Extract Content',
  description: 'Retrieve raw web content from specified URLs.',
  auth: tavilyAuth,
  props: {
    urls: Property.Array({
      displayName: 'URLs',
      description: 'The URLs you want to extract with Tavily.',
      required: true,
    }),
    include_images: Property.Checkbox({
      displayName: 'Include Images',
      description: 'Include a list of images extracted from the URLs in the response.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.tavily.com/extract',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        api_key: auth,
        urls: propsValue.urls,
        include_images: propsValue.include_images,
      },
    });

    return response.body;
  },
}); 