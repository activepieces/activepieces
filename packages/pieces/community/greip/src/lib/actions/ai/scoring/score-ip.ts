import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../../../auth';
import { greipClient } from '../../../common/client';
import { greipAiProps } from '../../../common/ai-props';
import { greipScoreIpOutputSchema } from '../../../output-schemas';

export const scoreIpAction = createAction({
  auth: greipAuth,
  name: 'greip_score_ip',
  outputSchema: greipScoreIpOutputSchema,
  displayName: 'Score IP',
  description: 'Get the threat score, risk level and recommendation for an IP address.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Get a threat score, risk level, recommendation and the matched rules for one IPv4 or IPv6 address. Use Look Up IP for location data instead.',
    idempotent: true,
  },
  props: {
    ip: Property.ShortText({
      displayName: 'IP Address',
      description: 'The IPv4 or IPv6 address to score.',
      required: true,
    }),
    userId: greipAiProps.userId({ required: false }),
  },
  async run(context) {
    const { ip, userId } = context.propsValue;
    return await greipClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/score/ip/${encodeURIComponent(ip)}`,
      query: userId ? { user_id: userId } : {},
    });
  },
});
