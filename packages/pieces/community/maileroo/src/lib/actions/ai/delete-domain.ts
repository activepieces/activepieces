import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooSuccessOutputSchema } from '../../output-schemas';

export const mailerooDeleteDomain = createAction({
  auth: mailerooAuth,
  outputSchema: mailerooSuccessOutputSchema,
  name: 'maileroo_delete_domain',
  displayName: 'Delete Domain',
  description: 'Permanently deletes a domain.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a domain and cannot be undone; sending from it stops. Get the domain_id from maileroo_list_domains. Hard delete: there is no recoverable variant. Requires an Account Key connection.',
    idempotent: true,
  },
  props: {
    domain_id: Property.Number({
      displayName: 'Domain ID',
      description: 'Numeric domain ID. Get it from maileroo_list_domains.',
      required: true,
    }),
  },
  async run(context) {
    const { domain_id } = context.propsValue;
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/domains/${encodeURIComponent(domain_id)}`,
    });
  },
});
