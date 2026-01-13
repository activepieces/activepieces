import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { woodpeckerAuth } from '../..';
import { woodpeckerClient } from '../common';

export const blacklistDomain = createAction({
  auth: woodpeckerAuth,
  name: 'blacklist_domain',
  displayName: 'Blacklist Domain',
  description: 'Add a domain to the blacklist to block sending to all prospects within that domain',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Domain to blacklist (e.g. example.com)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await woodpeckerClient.makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      '/v2/blacklist/domains',
      {
        domains: [propsValue.domain],
      }
    );
  },
});
