import { createAction, Property } from '@activepieces/pieces-framework';
import { BitlyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createBitlink = createAction({
  auth: BitlyAuth,
  name: 'createBitlink',
  displayName: 'Create Bitlink',
  description: 'Create a new Bitlink (shortened URL) using Bitly API.',
  props: {
    long_url: Property.ShortText({
      displayName: 'Long URL',
      required: true,
    }),
    domain: Property.ShortText({
      displayName: 'Domain',
      required: false,
      description: 'Bitly domain (e.g., bit.ly). Optional.',
    }),
    group_guid: Property.ShortText({
      displayName: 'Group GUID',
      required: false,
      description: 'Bitly group GUID. Optional.',
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
      description: 'Title for the Bitlink. Optional.',
    }),
    // tags: Property.Array({
    //   displayName: 'Tags',
    //   required: false,
    //   description: 'Tags for the Bitlink. Optional.',
    //   item: Property.ShortText({ displayName: 'Tag' }),
    // }),
    app_id: Property.ShortText({ displayName: 'App ID', required: true }),
    app_uri_path: Property.ShortText({
      displayName: 'App URI Path',
      required: true,
    }),
    install_url: Property.ShortText({
      displayName: 'Install URL',
      required: true,
    }),
    install_type: Property.ShortText({
      displayName: 'Install Type',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, any> = {
      long_url: propsValue.long_url,
    };
    const deeplinks: Array<Record<string, any>> = [];
    if (propsValue.domain) body['domain'] = propsValue.domain;
    if (propsValue.group_guid) body['group_guid'] = propsValue.group_guid;
    if (propsValue.title) body['title'] = propsValue.title;
    // if (propsValue.tags) body['tags'] = propsValue.tags;
    if (propsValue.app_id) {
      deeplinks.push({
        app_id: propsValue.app_id,
      });
    }
    deeplinks.push({ app_uri_path: propsValue.app_uri_path });
    deeplinks.push({ install_url: propsValue.install_url });
    deeplinks.push({ install_type: propsValue.install_type });
    body['deeplinks'] = deeplinks;

    return await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/bitlinks',
      body
    );
  },
});
