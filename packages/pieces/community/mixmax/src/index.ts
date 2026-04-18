import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createContact } from './lib/actions/create-contact';
import { findContact } from './lib/actions/find-contact';
import { listContacts } from './lib/actions/list-contacts';
import { createCodeSnippet } from './lib/actions/create-code-snippet';
import { listCodeSnippets } from './lib/actions/list-code-snippets';

export const mixmaxAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: 'Your Mixmax API token (X-API-Token). Find it at Settings > API in Mixmax.',
  required: true,
});

export const mixmax = createPiece({
  displayName: 'Mixmax',
  description: 'Email productivity and automation platform for Gmail — sequences, tracking, templates, and integrations',
  auth: mixmaxAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mixmax.png',
  categories: [PieceCategory.COMMUNICATION, PieceCategory.SALES],
  authors: ['tarai-dl'],
  actions: [
    createContact,
    findContact,
    listContacts,
    createCodeSnippet,
    listCodeSnippets,
  ],
  triggers: [],
});
