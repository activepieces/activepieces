import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const findPersonByUsPhoneAction = createAction({
  auth: neuralvergeAuth,
  name: 'find_person_by_us_phone',
  classification: 'READ',
  displayName: 'Find Person by US Phone',
  description: 'US reverse phone lookup with carrier, line type and validity signals. Cost: 100 points (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'US-only reverse phone lookup with carrier, line type and activity/validity signals. Costs more than the global lookup; use Find Person by Phone for non-US numbers. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    phone: Property.ShortText({
      displayName: 'US Phone Number',
      description: 'US phone number with country code, digits only, for example 15555550100.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return neuralvergeClient.post({
      apiKey: auth.secret_text,
      endpoint: 'run-phone-enrichment-us',
      body: {
        phone: propsValue.phone,
      },
    });
  },
});
