import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { dubAuth } from '../..';

export const listLinks = createAction({
  name: 'list_links',
  auth: dubAuth,
  displayName: 'List Links',
  description: 'Get a list of your Dub.co short links',
  props: {
    domain: Property.ShortText({ displayName: 'Domain Filter', required: false }),
    tag: Property.ShortText({ displayName: 'Tag Filter', required: false }),
    page: Property.Number({ displayName: 'Page', required: false, defaultValue: 1 }),
    page_size: Property.Number({ displayName: 'Page Size', required: false, defaultValue: 50 }),
  },
  async run({ auth, propsValue }) {
    const params = new URLSearchParams({
      page: String(propsValue.page || 1),
      pageSize: String(propsValue.page_size || 50),
    });
    if (propsValue.domain) params.set('domain', propsValue.domain);
    if (propsValue.tag) params.set('tagNames', propsValue.tag);

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.dub.co/links?${params}`,
      headers: { Authorization: `Bearer ${auth}` },
    });
    return response.body;
  },
});
