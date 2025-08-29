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
import { newTask, newContact, newEvent, newOpportunity } from './lib/triggers';

export const wealthboxApi = createPiece({
  displayName: 'Wealthbox API',
  auth: PieceAuth.OAuth2({
    description: 'Authenticate with your Wealthbox account',
    authUrl: 'https://app.crmworkspace.com/oauth/authorize',
    tokenUrl: 'https://app.crmworkspace.com/oauth/token',
    required: true,
    scope: ['login', 'data']
  }),
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
  triggers: [newTask, newContact, newEvent, newOpportunity]
});
