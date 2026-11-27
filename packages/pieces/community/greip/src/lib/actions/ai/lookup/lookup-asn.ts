import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../../../auth';
import { greipClient } from '../../../common/client';
import { greipAiProps } from '../../../common/ai-props';
import { greipAsnOutputSchema } from '../../../output-schemas';

export const lookupAsnAction = createAction({
  auth: greipAuth,
  name: 'greip_lookup_asn',
  outputSchema: greipAsnOutputSchema,
  displayName: 'Look Up ASN',
  description: 'Get the owner, name and IP ranges of an Autonomous System Number.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Get details of an Autonomous System by its number, e.g. 15169 or AS15169. Look Up IP with the ASN module returns the ASN of an address.',
    idempotent: true,
  },
  props: {
    asn: Property.ShortText({
      displayName: 'AS Number',
      description: 'The Autonomous System Number, e.g. 15169 or AS15169.',
      required: true,
    }),
    userId: greipAiProps.userId({ required: false }),
  },
  async run(context) {
    const { asn, userId } = context.propsValue;
    return await greipClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/lookup/asn/${encodeURIComponent(asn)}`,
      query: userId ? { user_id: userId } : {},
    });
  },
});
