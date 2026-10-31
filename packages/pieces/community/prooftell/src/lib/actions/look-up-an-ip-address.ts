import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { prooftellAuth } from '../auth';
import { prooftellApi } from '../common';

export const lookUpIpAddress = createAction({
  auth: prooftellAuth,
  name: 'look_up_ip_address',
  classification: 'READ',
  displayName: 'Look up an IP address',
  description:
    'Whether the address is Tor, a VPN or a datacenter, with its country, city and network. Charged per check from your balance; the sandbox is free.',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up one IPv4 or IPv6 address with ProofTell: the Tor, VPN, datacenter and anonymous flags, the country, region and city, the ASN and its organization. To read an IP with a phone or an email as one risk score, use Assess the risk of an identity instead. A routable address is charged from the balance; a retry is charged again.',
    idempotent: true,
  },
  props: {
    ip: Property.ShortText({
      displayName: 'IP address',
      description: 'IPv4 or IPv6, such as 203.0.113.1.',
      required: true,
    }),
  },
  async run(context) {
    const { ip } = context.propsValue;
    return prooftellApi.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/ip',
      body: { ip },
    });
  },
});
