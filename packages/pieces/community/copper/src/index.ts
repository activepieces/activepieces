
import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

// Actions
import { testConnection } from './lib/actions/test-connection';

// Write Actions
import { createPerson } from './lib/actions/create-person';
import { updatePerson } from './lib/actions/update-person';
import { createLead } from './lib/actions/create-lead';
import { updateLead } from './lib/actions/update-lead';
import { convertLead } from './lib/actions/convert-lead';
import { createCompany } from './lib/actions/create-company';
import { updateCompany } from './lib/actions/update-company';
import { createOpportunity } from './lib/actions/create-opportunity';
import { updateOpportunity } from './lib/actions/update-opportunity';
import { createProject } from './lib/actions/create-project';
import { updateProject } from './lib/actions/update-project';
import { createTask } from './lib/actions/create-task';
import { createActivity } from './lib/actions/create-activity';

// Search Actions
import { searchPerson } from './lib/actions/search-person';
import { searchLead } from './lib/actions/search-lead';
import { searchCompany } from './lib/actions/search-company';
import { searchOpportunity } from './lib/actions/search-opportunity';
import { searchProject } from './lib/actions/search-project';
import { searchActivity } from './lib/actions/search-activity';

// Triggers
import { newPersonTrigger } from './lib/triggers/new-person-trigger';
import { newLeadTrigger } from './lib/triggers/new-lead-trigger';
import { newActivityTrigger } from './lib/triggers/new-activity-trigger';
import { updatedLeadTrigger } from './lib/triggers/updated-lead-trigger';

const markdownDescription = `
To obtain your Copper API credentials:

1. Login to your Copper account
2. Go to Settings > API
3. Copy your API Key
4. Your User Email is your Copper login email
`;

export const copperAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
      description: 'Your Copper API Key',
    }),
    email: Property.ShortText({
      displayName: 'User Email',
      required: true,
      description: 'Your Copper account email',
    }),
  },
  validate: async ({ auth }) => {
    try {
      const response = await fetch('https://api.copper.com/developer_api/v1/account', {
        method: 'GET',
        headers: {
          'X-PW-AccessToken': auth.api_key,
          'X-PW-UserEmail': auth.email,
          'X-PW-Application': 'developer_api',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        return {
          valid: false,
          error: 'Invalid API credentials',
        };
      }
      
      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to validate credentials',
      };
    }
  },
});

export const copper = createPiece({
  displayName: "Copper",
  description: 'Copper is a CRM for Google Workspace. Automate contacts, leads, opportunities, projects, tasks, and activities.',
  auth: copperAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/copper.png",
  authors: ['activepieces'],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    testConnection,
    
    // Write Actions
    createPerson,
    updatePerson,
    createLead,
    updateLead,
    convertLead,
    createCompany,
    updateCompany,
    createOpportunity,
    updateOpportunity,
    createProject,
    updateProject,
    createTask,
    createActivity,
    
    // Search Actions
    searchPerson,
    searchLead,
    searchCompany,
    searchOpportunity,
    searchProject,
    searchActivity,
    
    createCustomApiCallAction({
      auth: copperAuth,
      baseUrl: () => 'https://api.copper.com/developer_api/v1',
      authMapping: async (auth) => {
        const a = auth as { api_key: string; email: string };
        return {
          'X-PW-AccessToken': a.api_key,
          'X-PW-UserEmail': a.email,
          'X-PW-Application': 'developer_api',
        };
      },
    }),
  ],
  triggers: [
    newPersonTrigger,
    newLeadTrigger,
    newActivityTrigger,
    updatedLeadTrigger,
  ],
});
    