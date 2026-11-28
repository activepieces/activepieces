import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../../../auth';
import { greipClient } from '../../../common/client';
import { greipAiProps } from '../../../common/ai-props';
import { greipDomainOutputSchema } from '../../../output-schemas';

export const lookupDomainAction = createAction({
  auth: greipAuth,
  name: 'greip_lookup_domain',
  outputSchema: greipDomainOutputSchema,
  displayName: 'Look Up Domain',
  description: 'Get details about a domain, including whether it is disposable or forwarding.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Get details for a fully qualified domain name, including whether it is a disposable or forwarding email domain. Use Score Email to assess a full email address instead.',
    idempotent: true,
  },
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'The fully qualified domain name, e.g. example.com.',
      required: true,
    }),
    userId: greipAiProps.userId({ required: false }),
  },
  async run(context) {
    const { domain, userId } = context.propsValue;
    return await greipClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/lookup/domains/${encodeURIComponent(domain)}`,
      query: userId ? { user_id: userId } : {},
    });
  },
});
