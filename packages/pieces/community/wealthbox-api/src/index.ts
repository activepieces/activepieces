import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import {
  createContact,
  createNote,
  createProject,
  addHouseholdMember,
  createHousehold,
  createEvent,
  createOpportunity,
  createTask,
  startWorkflow,
  findContact,
  findTask
} from './lib/actions';
import { 
  newTask, 
  newContact, 
  newEvent, 
  newOpportunity 
} from './lib/triggers';

export const wealthboxAuth = PieceAuth.SecretText({
  displayName: 'API Access Token',
  description: 'Enter your Wealthbox API access token. Get it from Settings → API Access Tokens in your Wealthbox account.',
  required: true,
});

export const wealthboxApi = createPiece({
  displayName: 'Wealthbox API',
  auth: wealthboxAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/wealthbox-api.png',
  authors: [],
  actions: [
    createContact,
    createNote,
    createProject,
    addHouseholdMember,
    createHousehold,
    createEvent,
    createOpportunity,
    createTask,
    startWorkflow,
    findContact,
    findTask
  ],
  triggers: [
    newTask, 
    newContact, 
    newEvent, 
    newOpportunity
  ]
});
