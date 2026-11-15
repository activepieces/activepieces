import { createAction, Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitDropdowns } from '../common/dropdowns';
import { emailitOperations } from '../common/operations';
import { emailitSchemas } from '../common/output-schemas';

export const verifyDomainAction = createAction({
  auth: emailitAuth,
  name: 'verify_domain',
  displayName: 'Check Domain Verification',
  description: 'Re-check a sending domain\'s DNS records now and update its verification status.',
  audience: 'human',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Makes Emailit look up a sending domain\'s DNS records now and save the result, then returns the domain with fresh statuses. The domain becomes verified when SPF, DKIM and return-path are ok; any failing record shows in dns_records with its error. It changes no DNS; repeating it only re-checks. Needs a Full Access key.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.domain,
  props: { domain: emailitDropdowns.domain() },
  async run({ auth, propsValue }) {
    return emailitOperations.verifyDomain({ auth, domain: propsValue.domain });
  },
});

export const verifyDomainByIdAction = createAction({
  auth: emailitAuth,
  name: 'verify_domain_by_id',
  displayName: 'Check Domain Verification (by ID)',
  description: 'Re-check a sending domain given by ID or name.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Makes Emailit look up a sending domain\'s DNS records now and save the result, then returns the domain with fresh statuses. The domain becomes verified when SPF, DKIM and return-path are ok; any failing record shows in dns_records with its error. It changes no DNS; repeating it only re-checks. Needs a Full Access key. Takes the domain ID (dom_…) or name; List Sending Domains finds them.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.domain,
  props: { domain: Property.ShortText({ displayName: 'Domain', description: 'Domain ID (dom_…) or domain name.', required: true }) },
  async run({ auth, propsValue }) {
    return emailitOperations.verifyDomain({ auth, domain: propsValue.domain });
  },
});
