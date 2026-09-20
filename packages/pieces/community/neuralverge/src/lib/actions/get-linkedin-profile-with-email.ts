import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const getLinkedinProfileWithEmailAction = createAction({
  auth: neuralvergeAuth,
  name: 'get_linkedin_profile_with_email',
  classification: 'READ',
  displayName: 'Get LinkedIn Profile with Email',
  description: 'Get LinkedIn profile details plus a work email when available. Cost: 10 points (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'Fetch a LinkedIn profile (headline, positions, skills, education) from its URL, plus a work email when one can be found. Use when you already have the profile URL; use Find LinkedIn Profile to get the URL from a name. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    profile_url: Property.ShortText({
      displayName: 'LinkedIn Profile URL',
      description: 'Full LinkedIn profile URL, for example https://www.linkedin.com/in/janedoe/.',
      required: true,
    }),
    include_email: Property.Checkbox({
      displayName: 'Include Email',
      description: 'Also look up a work email for the profile.',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    return neuralvergeClient.post({
      apiKey: auth.secret_text,
      endpoint: 'run-linkedin-email',
      body: {
        username: propsValue.profile_url,
        includeEmail: propsValue.include_email,
      },
    });
  },
});
