import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { addPerson } from './lib/actions/add-person.action/add-person.action';
import { newPerson } from './lib/trigger/new-person';
import { newDeal } from './lib/trigger/new-deal';
import { newActivity } from './lib/trigger/new-activity';
import { updatedPerson } from './lib/trigger/updated-person';
import { updatedDeal } from './lib/trigger/updated-deal';

export const pipedriveAuth = PieceAuth.OAuth2({
  description: '',

  authUrl: 'https://oauth.pipedrive.com/oauth/authorize',
  tokenUrl: 'https://oauth.pipedrive.com/oauth/token',
  required: true,
  scope: ['admin', 'contacts:full', 'users:read'],
});

export const pipedrive = createPiece({
  displayName: 'Pipedrive',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pipedrive.png',
  auth: pipedriveAuth,
  actions: [addPerson],
  authors: ['ashrafsamhouri'],
  triggers: [newPerson, newDeal, newActivity, updatedPerson, updatedDeal],
});
