import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  PieceAuth,
  createPiece,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Import actions
import { createContactAction } from './lib/actions/create-contact';
import { updateContactAction } from './lib/actions/update-contact';
import { createDraftAction } from './lib/actions/create-draft';
import { createTaskAction } from './lib/actions/create-task';
import { findContactAction } from './lib/actions/find-contact';

// Import triggers
import { newMessageTrigger } from './lib/triggers/new-message';
import { newCommentTrigger } from './lib/triggers/new-comment';
import { newContactBookTrigger } from './lib/triggers/new-contact-book';
import { newContactGroupTrigger } from './lib/triggers/new-contact-group';
import { newContactTrigger } from './lib/triggers/new-contact';

export const missiveAuth = PieceAuth.CustomAuth({
  description: 'Authentication for Missive API',
  required: true,
  props: {
    apiToken: Property.ShortText({
      displayName: 'API Token',
      description: 'Your Missive API token. Get it from Missive preferences > API tab > Create a new token',
      required: true,
    }),
  },
});

export const missive = createPiece({
  displayName: 'Missive',
  description: 'Unified team inbox platform combining email, chat, and collaboration tools',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/missive.png',
  categories: [PieceCategory.COMMUNICATION],
  auth: missiveAuth,
  authors: [
    'activepieces',
  ],
  actions: [
    createContactAction,
    updateContactAction,
    createDraftAction,
    createTaskAction,
    findContactAction,
    createCustomApiCallAction({
      baseUrl: () => {
        return 'https://public.missiveapp.com/v1';
      },
      auth: missiveAuth,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as { apiToken: string }).apiToken}`,
        };
      },
    }),
  ],
  triggers: [
    newMessageTrigger,
    newCommentTrigger,
    newContactBookTrigger,
    newContactGroupTrigger,
    newContactTrigger,
  ],
}); 