import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { apiKeyOf, optionalInteger, optionalText } from '../common/client';
import { hunterOutputSchemas } from '../common/output-schemas';
import { companyProp, domainProp, emailTypeProp } from '../common/props';
import { hunterRequests } from '../common/requests';

export const domainSearchAction = createAction({
  auth: hunterAuth,
  name: 'domain_search',
  classification: 'SEARCH',
  displayName: 'Domain Search',
  description: 'Find the email addresses Hunter knows for a company domain. Uses 1 credit per 1-10 emails returned.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the email addresses Hunter knows at a domain or company (with names, positions, departments, confidence and sources), plus the email pattern and organization. Filter by type, seniority, department or required field. results is the total known, emails holds this page. Costs 1 Hunter credit per call that returns 1-10 emails. On the Free plan limit + offset must stay at 10 or below. Read-only.',
    idempotent: true,
  },
  props: {
    domain: domainProp,
    company: companyProp,
    type: emailTypeProp,
    seniority: Property.StaticMultiSelectDropdown({
      displayName: 'Seniority',
      required: false,
      options: { options: ['junior', 'senior', 'executive'].map((value) => ({ label: value, value })) },
    }),
    department: Property.StaticMultiSelectDropdown({
      displayName: 'Department',
      required: false,
      options: {
        options: [
          'executive',
          'it',
          'finance',
          'management',
          'sales',
          'legal',
          'support',
          'hr',
          'marketing',
          'communication',
          'education',
          'design',
          'health',
          'operations',
        ].map((value) => ({ label: value, value })),
      },
    }),
    required_field: Property.StaticMultiSelectDropdown({
      displayName: 'Required Fields',
      required: false,
      description: 'Only return emails that have these fields.',
      options: { options: ['full_name', 'position', 'phone_number'].map((value) => ({ label: value, value })) },
    }),
    limit: Property.Number({ displayName: 'Limit', required: false, description: 'Emails to return (1-100, default 10; Free plan max 10 total).' }),
    offset: Property.Number({ displayName: 'Offset', required: false, description: 'Emails to skip (default 0).' }),
  },
  outputSchema: hunterOutputSchemas.domainSearch,
  async run(context) {
    const values = context.propsValue;
    const domain = optionalText(values.domain);
    const company = optionalText(values.company);
    if (domain === undefined && company === undefined) {
      throw new Error('Provide a domain or a company name.');
    }
    return hunterRequests.domainSearch({
      apiKey: apiKeyOf(context.auth),
      query: {
        domain,
        company: domain === undefined ? company : undefined,
        type: optionalText(values.type),
        seniority: joined(values.seniority),
        department: joined(values.department),
        required_field: joined(values.required_field),
        limit: optionalInteger({ value: values.limit, label: 'Limit', min: 1, max: 100 }) ?? 10,
        offset: optionalInteger({ value: values.offset, label: 'Offset', min: 0, max: 100000 }),
      },
    });
  },
});

function joined(value: unknown): string | undefined {
  return Array.isArray(value) && value.length > 0 ? value.map(String).join(',') : undefined;
}
