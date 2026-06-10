import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const lookupTechnology = createAction({
  auth: pubrioAuth,
  name: 'lookup_technology',
  displayName: 'Lookup Technology',
  description: 'Look up technologies used by a company',
  props: {
    lookup_type: Property.StaticDropdown({
      displayName: 'Lookup Type',
      required: true,
      options: {
        options: [
          { label: 'Domain', value: 'domain' },
          { label: 'LinkedIn URL', value: 'linkedin_url' },
          { label: 'Domain Search ID', value: 'domain_search_id' },
          { label: 'Domain ID', value: 'domain_id' },
        ],
      },
    }),
    value: Property.ShortText({
      displayName: 'Value',
      required: true,
      description:
        'Domain, LinkedIn URL, Domain Search ID, or Domain ID (integer)',
    }),
  },
  async run(context) {
    const lookupType = context.propsValue.lookup_type;
    const rawValue = context.propsValue.value;
    const body: Record<string, unknown> = {};
    if (lookupType === 'domain_id') {
      const parsed = parseInt(rawValue, 10);
      if (isNaN(parsed)) {
        throw new Error(`domain_id must be a valid integer, got: "${rawValue}"`);
      }
      body[lookupType] = parsed;
    } else {
      body[lookupType] = rawValue;
    }
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/technologies/lookup',
      body
    );
  },
});
