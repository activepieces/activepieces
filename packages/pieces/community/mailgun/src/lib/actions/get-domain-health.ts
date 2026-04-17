import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailgunAuth } from '../..';
import { mailgunCommon, mailgunApiCall } from '../common';

export const getDomainHealth = createAction({
  auth: mailgunAuth,
  name: 'get_domain_health',
  displayName: 'Get Domain Health',
  description:
    'Fetch the health of a Mailgun domain: current state, whether it has been disabled, and DNS verification status for sending and receiving records. Useful for detecting Mailgun-side incidents (e.g. a domain disabled after abuse).',
  props: {
    domain: mailgunCommon.domainDropdown,
  },
  async run(context) {
    const { domain } = context.propsValue;
    const auth = context.auth;

    const response = await mailgunApiCall<DomainDetailsResponse>({
      apiKey: auth.props.api_key,
      region: auth.props.region,
      method: HttpMethod.GET,
      path: `/v4/domains/${domain}`,
    });

    const body = response.body;
    const sendingRecords = body.sending_dns_records ?? [];
    const receivingRecords = body.receiving_dns_records ?? [];

    const sendingValid =
      sendingRecords.length > 0 &&
      sendingRecords.every((r) => r.valid === 'valid');
    const receivingValid =
      receivingRecords.length > 0 &&
      receivingRecords.every((r) => r.valid === 'valid');

    return {
      name: body.domain.name,
      state: body.domain.state,
      is_disabled: body.domain.is_disabled ?? false,
      created_at: body.domain.created_at,
      wildcard: body.domain.wildcard ?? false,
      spam_action: body.domain.spam_action,
      require_tls: body.domain.require_tls ?? false,
      sending_dns_valid: sendingValid,
      receiving_dns_valid: receivingValid,
      sending_dns_records: sendingRecords,
      receiving_dns_records: receivingRecords,
    };
  },
});

type DnsRecord = {
  record_type: string;
  valid: string;
  name?: string;
  value: string;
};

type DomainDetailsResponse = {
  domain: {
    name: string;
    state: string;
    is_disabled?: boolean;
    created_at: string;
    wildcard?: boolean;
    spam_action: string;
    require_tls?: boolean;
    type?: string;
  };
  receiving_dns_records?: DnsRecord[];
  sending_dns_records?: DnsRecord[];
};
