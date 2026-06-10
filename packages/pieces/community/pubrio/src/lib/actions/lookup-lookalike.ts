import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const lookupLookalike = createAction({
  auth: pubrioAuth,
  name: 'lookup_lookalike',
  displayName: 'Lookup Lookalike Company',
  description:
    'Look up a similar company result by domain, LinkedIn URL, or domain search ID',
  props: {
    lookup_type: Property.StaticDropdown({
      displayName: 'Lookup Type',
      required: true,
      options: {
        options: [
          { label: 'Domain', value: 'domain' },
          { label: 'LinkedIn URL', value: 'linkedin_url' },
          { label: 'Domain Search ID', value: 'domain_search_id' },
        ],
      },
    }),
    value: Property.ShortText({
      displayName: 'Value',
      required: true,
      description: 'Domain, LinkedIn URL, or Domain Search ID',
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      [context.propsValue.lookup_type]: context.propsValue.value,
    };
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/companies/lookalikes/lookup',
      body
    );
  },
});
