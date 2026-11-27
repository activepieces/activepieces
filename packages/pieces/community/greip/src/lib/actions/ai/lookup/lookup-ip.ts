import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../../../auth';
import { greipClient } from '../../../common/client';
import { greipAiProps } from '../../../common/ai-props';
import { greipLookupIpOutputSchema } from '../../../output-schemas';

export const lookupIpAction = createAction({
  auth: greipAuth,
  name: 'greip_lookup_ip',
  outputSchema: greipLookupIpOutputSchema,
  displayName: 'Look Up IP',
  description: 'Get geolocation and optional security, currency, timezone and device data for one IP address.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Geolocate one IPv4 or IPv6 address, optionally adding VPN/proxy/Tor/bot flags (security module), currency, timezone, location or device data. Use Score IP instead for a threat score and recommendation, or Bulk Look Up IPs for several addresses.',
    idempotent: true,
  },
  props: {
    ip: Property.ShortText({
      displayName: 'IP Address',
      description: 'The IPv4 or IPv6 address to look up.',
      required: true,
    }),
    modules: greipAiProps.ipModules({ required: false }),
    language: greipAiProps.language({ required: false }),
    userId: greipAiProps.userId({ required: false }),
  },
  async run(context) {
    const { ip, modules, language, userId } = context.propsValue;
    return await greipClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/lookup/ip/${encodeURIComponent(ip)}`,
      query: {
        ...(modules && modules.length > 0 ? { params: modules.join(',') } : {}),
        ...(language ? { lang: language } : {}),
        ...(userId ? { user_id: userId } : {}),
      },
    });
  },
});
