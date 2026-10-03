import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooDomainOutputSchema } from '../../output-schemas';

export const mailerooCreateDomain = createAction({
  auth: mailerooAuth,
  name: 'maileroo_create_domain',
  outputSchema: mailerooDomainOutputSchema,
  displayName: 'Create Domain',
  description: 'Adds a custom domain or a free sub-domain.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Adds a domain to the account and returns the DNS records to configure. Use type custom with domain_name, or type free with sub_domain. Not idempotent: adding the same domain twice fails or duplicates. Requires an Account Key connection.',
    idempotent: false,
  },
  props: {
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Custom domain or free sub-domain.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Custom domain', value: 'custom' },
          { label: 'Free sub-domain', value: 'free' },
        ],
      },
    }),
    domain_name: Property.ShortText({
      displayName: 'Domain Name',
      description: 'Required for type custom, for example example.com.',
      required: false,
    }),
    sub_domain: Property.ShortText({
      displayName: 'Sub-domain',
      description: 'Required for type free.',
      required: false,
    }),
  },
  async run(context) {
    const { type, domain_name, sub_domain } = context.propsValue;
    if (type === 'custom' && !domain_name) {
      throw new Error('Domain Name is required when the type is custom.');
    }
    if (type === 'free' && !sub_domain) {
      throw new Error('Sub-domain is required when the type is free.');
    }
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/domains',
      body: {
        type,
        ...spreadIfDefined('domain_name', type === 'custom' ? domain_name : undefined),
        ...spreadIfDefined('sub_domain', type === 'free' ? sub_domain : undefined),
      },
    });
  },
});
