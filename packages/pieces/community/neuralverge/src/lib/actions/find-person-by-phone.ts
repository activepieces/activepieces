import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const findPersonByPhoneAction = createAction({
  auth: neuralvergeAuth,
  name: 'find_person_by_phone',
  classification: 'READ',
  displayName: 'Find Person by Phone',
  description: 'Reverse phone lookup (global): name, emails, location, company and social profiles. Cost: 10 points (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'Reverse phone lookup for any country: find the person behind a phone number (name, emails, locations, company, social profiles). For US numbers needing carrier and line type use Find Person by US Phone. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in international format, for example +15555550100.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return neuralvergeClient.post({
      apiKey: auth.secret_text,
      endpoint: 'run-phone-enrichment',
      body: {
        phone: propsValue.phone,
      },
    });
  },
});
