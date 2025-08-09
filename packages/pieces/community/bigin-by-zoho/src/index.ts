import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { biginAuth } from './lib/common/auth';

// Search actions
import { searchContactAction } from './lib/actions/search-contact';
import { searchCompanyAction } from './lib/actions/search-company';
import { searchProductAction } from './lib/actions/search-product';
import { searchPipelineRecordAction } from './lib/actions/search-pipeline-record';
import { searchUserAction } from './lib/actions/search-user';

// Contact actions
import { createContactAction } from './lib/actions/create-contact';
import { updateContactAction } from './lib/actions/update-contact';

// Company actions
import { createCompanyAction } from './lib/actions/create-company';
import { updateCompanyAction } from './lib/actions/update-company';

// Pipeline record actions
import { createPipelineRecordAction } from './lib/actions/create-pipeline-record';
import { updatePipelineRecordAction } from './lib/actions/update-pipeline-record';

// Task actions
import { createTaskAction } from './lib/actions/create-task';
import { updateTaskAction } from './lib/actions/update-task';

// Event actions
import { createEventAction } from './lib/actions/create-event';
import { updateEventAction } from './lib/actions/update-event';

// Call actions
import { createCallAction } from './lib/actions/create-call';

// Triggers
import { newContactTrigger } from './lib/triggers/new-contact';
import { updatedContactTrigger } from './lib/triggers/updated-contact';
import { newCompanyTrigger } from './lib/triggers/new-company';
import { newPipelineRecordTrigger } from './lib/triggers/new-pipeline-record';

export const biginByZoho = createPiece({
  displayName: 'Bigin by Zoho',
  description: 'Lightweight CRM designed for small businesses to manage contacts, companies, deals, tasks, calls, and events.',
  auth: biginAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/bigin-by-zoho.png',
  authors: ['activepieces'],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    // Search actions
    searchContactAction,
    searchCompanyAction,
    searchProductAction,
    searchPipelineRecordAction,
    searchUserAction,
    // Contact actions
    createContactAction,
    updateContactAction,
    // Company actions
    createCompanyAction,
    updateCompanyAction,
    // Pipeline record actions
    createPipelineRecordAction,
    updatePipelineRecordAction,
    // Task actions
    createTaskAction,
    updateTaskAction,
    // Event actions
    createEventAction,
    updateEventAction,
    // Call actions
    createCallAction,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        const domain = auth.props?.['domain'] || 'com';
        const domainToApiUrl: Record<string, string> = {
          'com': 'https://www.zohoapis.com',
          'eu': 'https://www.zohoapis.eu',
          'in': 'https://www.zohoapis.in',
          'com.au': 'https://www.zohoapis.com.au',
          'jp': 'https://www.zohoapis.jp',
          'com.cn': 'https://www.zohoapis.com.cn',
          'sa': 'https://www.zohoapis.sa',
          'ca': 'https://www.zohoapis.ca'
        };
        return `${domainToApiUrl[domain]}/bigin/v2`;
      },
      auth: biginAuth,
      authMapping: async (auth) => ({
        Authorization: `Zoho-oauthtoken ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [
    newContactTrigger,
    updatedContactTrigger,
    newCompanyTrigger,
    newPipelineRecordTrigger,
  ],
});

export { biginAuth };
