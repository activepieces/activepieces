import { createAction } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { apiKeyOf, optionalText } from '../common/client';
import { hunterOutputSchemas } from '../common/output-schemas';
import { companyProp, domainProp, emailTypeProp } from '../common/props';
import { hunterRequests } from '../common/requests';

export const countEmailsAction = createAction({
  auth: hunterAuth,
  name: 'count-emails',
  classification: 'READ',
  displayName: 'Count Emails',
  description: 'Returns the number of email addresses found for a domain or company.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns how many email addresses Hunter knows for a domain or company (total, personal, generic, and counts by department and seniority), optionally only personal or generic ones. Use to gauge coverage before Domain Search. Give a domain or a company name (domain wins when both are set). Free: uses no credits. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    domain: domainProp,
    company: companyProp,
    type: emailTypeProp,
  },
  outputSchema: hunterOutputSchemas.emailCount,
  async run(context) {
    const domain = optionalText(context.propsValue.domain);
    const company = optionalText(context.propsValue.company);
    if (domain === undefined && company === undefined) {
      throw new Error('Provide a domain or a company name.');
    }
    const data = await hunterRequests.countEmails({
      apiKey: apiKeyOf(context.auth),
      query: { domain, company: domain === undefined ? company : undefined, type: optionalText(context.propsValue.type) },
    });
    return {
      total: data['total'],
      personal_emails: data['personal_emails'],
      generic_emails: data['generic_emails'],
      department: data['department'],
      seniority: data['seniority'],
    };
  },
});
