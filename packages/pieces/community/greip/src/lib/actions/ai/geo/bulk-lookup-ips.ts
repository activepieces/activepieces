import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../../../auth';
import { greipClient } from '../../../common/client';
import { greipAiProps } from '../../../common/ai-props';
import { greipBulkLookupIpsOutputSchema } from '../../../output-schemas';

export const bulkLookupIpsAction = createAction({
  auth: greipAuth,
  name: 'greip_bulk_lookup_ips',
  outputSchema: greipBulkLookupIpsOutputSchema,
  displayName: 'Bulk Look Up IPs',
  description: 'Get geolocation and optional security, currency, timezone and device data for several IP addresses in one request.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Look up several IPv4 or IPv6 addresses in one call; use Look Up IP for a single address or Score IP for a threat score. The comma-joined list must stay within 159 characters, so send roughly 5 to 10 addresses per call. Duplicate and invalid addresses are skipped by Greip.',
    idempotent: true,
  },
  props: {
    ips: Property.Array({
      displayName: 'IP Addresses',
      description: 'The IPv4 or IPv6 addresses to look up. Joined with commas, the list must stay within 159 characters.',
      required: true,
    }),
    modules: greipAiProps.ipModules({ required: false }),
    language: greipAiProps.language({ required: false }),
    userId: greipAiProps.userId({ required: false }),
  },
  async run(context) {
    const { ips, modules, language, userId } = context.propsValue;
    const joinedIps = ips.map((ip) => String(ip)).join(',');
    if (joinedIps.length > MAX_IPS_LENGTH) {
      throw new Error(`IP Addresses: the comma-joined list is ${joinedIps.length} characters; Greip accepts at most ${MAX_IPS_LENGTH}. Split it into smaller calls.`);
    }
    return await greipClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/geo/ip/bulk',
      query: {
        ips: joinedIps,
        ...(modules && modules.length > 0 ? { params: modules.join(',') } : {}),
        ...(language ? { lang: language } : {}),
        ...(userId ? { user_id: userId } : {}),
      },
    });
  },
});

const MAX_IPS_LENGTH = 159;
