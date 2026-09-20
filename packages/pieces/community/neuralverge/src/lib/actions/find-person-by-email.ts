import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const findPersonByEmailAction = createAction({
  auth: neuralvergeAuth,
  name: 'find_person_by_email',
  classification: 'READ',
  displayName: 'Find Person by Email',
  description: 'Reverse email lookup: name, phones, location, company, position and social profiles. Cost: 10 points (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'Reverse email lookup: find the person behind an email address (full name, phones, locations, company, position, LinkedIn). Use Find Email by Name for the opposite direction. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to look up, for example jane.doe@example.com.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return neuralvergeClient.post({
      apiKey: auth.secret_text,
      endpoint: 'run-email-enrichment',
      body: {
        email: propsValue.email,
      },
    });
  },
});
