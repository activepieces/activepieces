import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const findEmailByNameAction = createAction({
  auth: neuralvergeAuth,
  name: 'find_email_by_name',
  classification: 'SEARCH',
  displayName: 'Find Email by Name',
  description: 'Find and verify a work email from first name, last name and company domain. Cost: 10 points (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'Find a professional email address for a person from first name, last name and company domain. Use Find Person by Email for the reverse direction. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'First name, for example Jane.',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name, for example Doe.',
      required: true,
    }),
    domain: Property.ShortText({
      displayName: 'Company Domain',
      description: 'Company website domain, for example example.com.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return neuralvergeClient.post({
      apiKey: auth.secret_text,
      endpoint: 'run-email-finder',
      body: {
        first_name: propsValue.first_name,
        last_name: propsValue.last_name,
        domain: propsValue.domain,
      },
    });
  },
});
