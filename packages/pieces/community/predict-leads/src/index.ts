import {
  createPiece,
  PieceAuth,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { findCompaniesAction, findCompanyByDomainAction } from './lib/actions/companies';
import { findJobOpeningsAction, getAJobOpeningByIdAction, getCompanyJobOpeningsActions } from './lib/actions/jobs';
import { makeClient } from './lib/common';
import { findTechnologiesByCompanyAction, findCompaniesByTechnologyIdAction } from './lib/actions/technology';
import { findNewsEventByIdAction, findNewsEventsByDomainAction } from './lib/actions/news-events';
import { findConnectionsAction, findConnectionsByDomainAction } from './lib/actions/connections';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const PredictLeadsAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
    To obtain your PredictLeads tokens, follow these steps:

    1. Have a PredictLeads account - Create a new user here: https://predictleads.com/sign_up.
    2. Go to: https://predictleads.com/subscriptions.
    3. In the subscription page, locate the API Key and Tokens section where you can also find the usage.
    `,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'The key of the Predict Leads account.',
      required: true,
    }),
    apiToken: PieceAuth.SecretText({
      displayName: 'API Token',
      description: 'The token of the Predict Leads account.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = makeClient(
        auth as PiecePropValueSchema<typeof PredictLeadsAuth>
      );
      await client.findCompanyByDomain("google.com");
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Token or API Key.',
      };
    }
  },
});

export const predictLeads = createPiece({
  displayName: 'PredictLeads',
  auth: PredictLeadsAuth,
  description: `Company Intelligence Data Source`,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/predict-leads.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE, PieceCategory.SALES_AND_CRM, PieceCategory.MARKETING],
  authors: [
    'codegino',
  ],
  actions: [
    findCompaniesAction,
    findCompanyByDomainAction,
    findJobOpeningsAction,
    getCompanyJobOpeningsActions,
    getAJobOpeningByIdAction,
    findTechnologiesByCompanyAction,
    findCompaniesByTechnologyIdAction,
    findNewsEventsByDomainAction,
    findNewsEventByIdAction,
    findConnectionsAction,
    findConnectionsByDomainAction,
    createCustomApiCallAction({
      auth:PredictLeadsAuth,
      baseUrl:()=>'https://predictleads.com/api/v3',
      authMapping: async (auth)=>{
        const authValue = auth as PiecePropValueSchema<typeof PredictLeadsAuth>;
        return{
          'X-Api-Key':authValue.apiKey,
          'X-Api-Token':authValue.apiToken
        }
      }
    })
  ],
  triggers: [],
});
