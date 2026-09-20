import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const getCompanyFundingAction = createAction({
  auth: neuralvergeAuth,
  name: 'get_company_funding',
  classification: 'READ',
  displayName: 'Get Company Funding',
  description: 'Get funding rounds, investors and firmographics from a Crunchbase organization URL. Cost: 15 points (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'Get a company profile from its Crunchbase organization URL: website, HQ, founding year, headcount, industries, funding rounds and investors. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    url: Property.ShortText({
      displayName: 'Crunchbase URL',
      description: 'Crunchbase organization URL, for example https://www.crunchbase.com/organization/example.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return neuralvergeClient.post({
      apiKey: auth.secret_text,
      endpoint: 'run-crunchbase-company',
      body: {
        url: propsValue.url,
      },
    });
  },
});
