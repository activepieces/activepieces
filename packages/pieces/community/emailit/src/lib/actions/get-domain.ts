import { createAction, Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitDropdowns } from '../common/dropdowns';
import { emailitOperations } from '../common/operations';
import { emailitSchemas } from '../common/output-schemas';

export const getDomainAction = createAction({
  auth: emailitAuth,
  name: 'get_domain',
  displayName: 'Get Sending Domain',
  description: 'Get a sending domain with its verification status and the DNS records to publish.',
  audience: 'human',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one Emailit sending domain: verification_status, each record\'s status and error, and the DNS records to publish. Statuses reflect the last DNS check; call Check Domain Verification to re-check now. Read-only; needs a Full Access key.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.domain,
  props: { domain: emailitDropdowns.domain() },
  async run({ auth, propsValue }) {
    return emailitOperations.getDomain({ auth, domain: propsValue.domain });
  },
});

export const getDomainByIdAction = createAction({
  auth: emailitAuth,
  name: 'get_domain_by_id',
  displayName: 'Get Sending Domain (by ID)',
  description: 'Get a sending domain by ID or name.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one Emailit sending domain: verification_status, each record\'s status and error, and the DNS records to publish. Statuses reflect the last DNS check; call Check Domain Verification to re-check now. Read-only; needs a Full Access key. Takes the domain ID (dom_…) or name (acme.com); List Sending Domains finds them.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.domain,
  props: { domain: Property.ShortText({ displayName: 'Domain', description: 'Domain ID (dom_…) or domain name, e.g. acme.com.', required: true }) },
  async run({ auth, propsValue }) {
    return emailitOperations.getDomain({ auth, domain: propsValue.domain });
  },
});
