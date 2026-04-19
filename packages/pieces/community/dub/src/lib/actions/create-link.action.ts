import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { dubAuth } from '../..';

export const createLink = createAction({
  name: 'create_link',
  auth: dubAuth,
  displayName: 'Create Short Link',
  description: 'Create a new short link with Dub.co',
  props: {
    url: Property.ShortText({ displayName: 'Destination URL', description: 'The long URL to shorten', required: true }),
    domain: Property.ShortText({ displayName: 'Domain', description: 'Custom domain (e.g. dub.sh). Leave empty for default.', required: false }),
    key: Property.ShortText({ displayName: 'Custom Key', description: 'Custom back-half for the link (e.g. "my-campaign")', required: false }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    tags: Property.Array({ displayName: 'Tags', required: false }),
    utm_source: Property.ShortText({ displayName: 'UTM Source', required: false }),
    utm_medium: Property.ShortText({ displayName: 'UTM Medium', required: false }),
    utm_campaign: Property.ShortText({ displayName: 'UTM Campaign', required: false }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = { url: propsValue.url };
    if (propsValue.domain) body['domain'] = propsValue.domain;
    if (propsValue.key) body['key'] = propsValue.key;
    if (propsValue.title) body['title'] = propsValue.title;
    if (propsValue.tags?.length) body['tagNames'] = propsValue.tags;
    if (propsValue.utm_source) body['utm_source'] = propsValue.utm_source;
    if (propsValue.utm_medium) body['utm_medium'] = propsValue.utm_medium;
    if (propsValue.utm_campaign) body['utm_campaign'] = propsValue.utm_campaign;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.dub.co/links',
      headers: { Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json' },
      body,
    });
    return response.body;
  },
});
