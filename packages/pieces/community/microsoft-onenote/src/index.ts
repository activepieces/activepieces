import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { appendNoteAction } from './lib/actions/append-note';
import { createImageNoteAction } from './lib/actions/create-image-note';
import { createNoteInSectionAction } from './lib/actions/create-note-in-section';
import { createNotebookAction } from './lib/actions/create-notebook';
import { createPageAction } from './lib/actions/create-page';
import { createSectionAction } from './lib/actions/create-section';
import { microsoftOneNoteAiActions } from './lib/actions/ai';
import { microsoftOneNoteAuth } from './lib/auth';
import { microsoftOneNoteClient } from './lib/common/client';
import { newNoteInSectionTrigger } from './lib/triggers/new-note-in-section';

export const microsoftOnenote = createPiece({
  displayName: 'Microsoft OneNote',
  description:
    'Microsoft OneNote is a note-taking app that allows you to create, edit, and share notes with others.',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: microsoftOneNoteAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-onenote.png',
  authors: ['fortunamide', 'onyedikachi-david'],
  actions: [
    createNotebookAction,
    createSectionAction,
    createNoteInSectionAction,
    createPageAction,
    createImageNoteAction,
    appendNoteAction,
    ...microsoftOneNoteAiActions,
    createCustomApiCallAction({
      auth: microsoftOneNoteAuth,
      baseUrl: (auth) =>
        auth ? `${microsoftOneNoteClient.baseUrl({ auth })}/v1.0/` : '',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [newNoteInSectionTrigger],
});
