import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createNote } from './lib/actions/create-note';
import { updateNote } from './lib/actions/update-note';
import { appendToNote } from './lib/actions/append-to-note';
import { createNotebook } from './lib/actions/create-notebook';
import { createTag } from './lib/actions/create-tag';
import { findNote } from './lib/actions/find-note';
import { findTag } from './lib/actions/find-tag';
import { newNote } from './lib/triggers/new-note';
import { newNotebook } from './lib/triggers/new-notebook';
import { newTagAdded } from './lib/triggers/new-tag-added';

export const evernoteAuth = PieceAuth.SecretText({
  displayName: 'Developer Token',
  description: `
    To obtain your developer token:
    
    1. Go to the Evernote Developer Portal (https://dev.evernote.com/)
    2. Log in or create an account
    3. Go to "Get an API Key" section
    4. Request a developer token for your application
    5. Copy the token and paste it here
    
    Note: Developer tokens are long-lived and don't expire unless revoked.
    They provide direct API access without OAuth complexity.
  `,
  required: true,
});

export const evernote = createPiece({
  displayName: 'Evernote',
  description: 'Note-taking and organization app for capturing ideas, tasks, and documents',
  logoUrl: 'https://cdn.activepieces.com/pieces/evernote.png',
  categories: [PieceCategory.PRODUCTIVITY],
  minimumSupportedRelease: '0.36.1',
  authors: ['sparkybug'],
  auth: evernoteAuth,
  actions: [
    createNote,
    updateNote,
    appendToNote,
    createNotebook,
    createTag,
    findNote,
    findTag,
    createCustomApiCallAction({
      baseUrl: () => 'https://www.evernote.com/edam',
      auth: evernoteAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [newNote, newNotebook, newTagAdded],
});
