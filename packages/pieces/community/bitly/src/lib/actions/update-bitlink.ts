import { createAction, Property } from '@activepieces/pieces-framework';
import { BitlyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateBitlink = createAction({
  auth: BitlyAuth,
  name: 'updateBitlink',
  displayName: 'Update Bitlink',
  description: 'Update an existing Bitlink using Bitly API.',
  props: {
    bitlink_id: Property.ShortText({
      displayName: 'Bitlink ID',
      required: true,
      description: 'The Bitlink to update (e.g., bit.ly/12a4b6c)',
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
      description: 'Title for the Bitlink. Optional.',
    }),
    archived: Property.Checkbox({
      displayName: 'Archived',
      required: false,
      description: 'Archive this Bitlink?',
    }),
    guid: Property.ShortText({ displayName: 'GUID', required: false }),
    bitlink: Property.ShortText({ displayName: 'Bitlink', required: false }),
    app_uri_path: Property.ShortText({
      displayName: 'App URI Path',
      required: false,
    }),
    install_url: Property.ShortText({
      displayName: 'Install URL',
      required: false,
    }),
    app_guid: Property.ShortText({ displayName: 'App GUID', required: false }),
    os: Property.ShortText({ displayName: 'OS', required: false }),
    install_type: Property.ShortText({
      displayName: 'Install Type',
      required: false,
    }),
    brand_guid: Property.ShortText({
      displayName: 'Brand GUID',
      required: false,
    }),
    // tags: Property.Array({
    //   displayName: 'Tags',
    //   required: false,
    //   description: 'Tags for the Bitlink. Optional.',
    //   item: Property.ShortText({ displayName: 'Tag' }),
    // }),
  },
  async run({ auth, propsValue }) {
    const { bitlink_id, ...rest } = propsValue;
    const body: Record<string, any> = {};
    const deeplinks: Array<Record<string, any>> = [];
    if (rest.title) body['title'] = rest.title;
    if (rest.archived !== undefined) body['archived'] = rest.archived;
    if (rest.guid) body['guid'] = rest.guid;

    if (rest.bitlink) deeplinks.push({ bitlink: rest.bitlink });
    if (rest.app_uri_path) deeplinks.push({ app_uri_path: rest.app_uri_path });
    if (rest.install_url) deeplinks.push({ install_url: rest.install_url });
    if (rest.app_guid) deeplinks.push({ app_guid: rest.app_guid });
    if (rest.os) deeplinks.push({ os: rest.os });
    if (rest.install_type) deeplinks.push({ install_type: rest.install_type });
    if (rest.brand_guid) deeplinks.push({ brand_guid: rest.brand_guid });

    if (deeplinks.length > 0) {
      body['deeplinks'] = deeplinks;
    }

    body['deeplinks'] = deeplinks;

    return await makeRequest(
      auth as string,
      HttpMethod.PATCH,
      `/bitlinks/${bitlink_id}`,
      body
    );
  },
});
