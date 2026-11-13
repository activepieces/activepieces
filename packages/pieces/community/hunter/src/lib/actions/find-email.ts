import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { apiKeyOf, optionalInteger, optionalText } from '../common/client';
import { hunterOutputSchemas } from '../common/output-schemas';
import { companyProp, domainProp, fullNameProp, maxDurationProp } from '../common/props';
import { hunterRequests } from '../common/requests';

export const findEmailAction = createAction({
  auth: hunterAuth,
  name: 'find-email',
  classification: 'SEARCH',
  displayName: 'Find Email',
  description: 'Find the most likely email of a person at a company. Uses 1 credit when an email is found.',
  audience: 'both',
  aiMetadata: {
    description:
      'Finds the most likely professional email for a person at a company, with a confidence score, sources and verification status. Needs a domain, a company name or a LinkedIn handle, plus first and last name or a full name (not needed with a LinkedIn handle). Costs 1 Hunter credit when an email is found (none when not found; repeats of the same email in a billing month are free). Read-only on Hunter data.',
    idempotent: true,
  },
  props: {
    domain: domainProp,
    company: companyProp,
    first_name: Property.ShortText({ displayName: 'First Name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
    full_name: fullNameProp,
    linkedin_handle: Property.ShortText({
      displayName: 'LinkedIn Handle',
      required: false,
      description: 'Handle from the LinkedIn profile URL. Replaces domain and name.',
      placeholder: 'john-doe-123',
    }),
    max_duration: maxDurationProp,
  },
  outputSchema: hunterOutputSchemas.emailFinder,
  async run(context) {
    const domain = optionalText(context.propsValue.domain);
    const company = optionalText(context.propsValue.company);
    const firstName = optionalText(context.propsValue.first_name);
    const lastName = optionalText(context.propsValue.last_name);
    const fullName = optionalText(context.propsValue.full_name);
    const linkedinHandle = optionalText(context.propsValue.linkedin_handle);
    if (linkedinHandle === undefined) {
      if (domain === undefined && company === undefined) {
        throw new Error('Provide a domain, a company name or a LinkedIn handle.');
      }
      if (!((firstName !== undefined && lastName !== undefined) || fullName !== undefined)) {
        throw new Error('Provide both first and last name, or a full name.');
      }
    }
    const data = await hunterRequests.findEmail({
      apiKey: apiKeyOf(context.auth),
      query: {
        domain,
        company: domain === undefined ? company : undefined,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        linkedin_handle: linkedinHandle,
        max_duration: optionalInteger({ value: context.propsValue.max_duration, label: 'Max Duration', min: 3, max: 20 }),
      },
    });
    return {
      first_name: data['first_name'],
      last_name: data['last_name'],
      email: data['email'],
      score: data['score'],
      domain: data['domain'],
      accept_all: data['accept_all'],
      position: data['position'],
      twitter: data['twitter'],
      linkedin_url: data['linkedin_url'],
      phone_number: data['phone_number'],
      company: data['company'],
      sources: data['sources'],
      verification: data['verification'],
    };
  },
});
