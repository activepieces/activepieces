import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { createContact } from './lib/actions/create-contact';
import { newPerson } from './lib/triggers/new-person';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { twentyAuth } from './lib/auth';


export const twenty = createPiece({
  displayName: 'Twenty',
  description: 'Open-source CRM platform.',
  auth: twentyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://raw.githubusercontent.com/twentyhq/twenty/main/packages/twenty-website/public/images/symbol.png',
  authors: ['Akash5908'],
  actions: [createContact],
  triggers: [newPerson],
});
