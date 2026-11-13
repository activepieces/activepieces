import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { addNoteToCollectionAction } from './lib/actions/add-note-to-collection';
import { createCollectionAction } from './lib/actions/create-collection';
import { createMemAction } from './lib/actions/create-mem';
import { createNoteAction } from './lib/actions/create-note';
import { deleteCollectionAction } from './lib/actions/delete-collection';
import { deleteNoteAction } from './lib/actions/delete-note';
import { findRelatedNotesAction } from './lib/actions/find-related-notes';
import { getCollectionAction } from './lib/actions/get-collection';
import { getNoteAction } from './lib/actions/get-note';
import { listCollectionsAction } from './lib/actions/list-collections';
import { listNotesAction } from './lib/actions/list-notes';
import { moveNoteAction } from './lib/actions/move-note';
import { removeNoteFromCollectionAction } from './lib/actions/remove-note-from-collection';
import { searchCollectionsAction } from './lib/actions/search-collections';
import { searchNotesAction } from './lib/actions/search-notes';
import { setNoteCreatedAtAction } from './lib/actions/set-note-created-at';
import { restoreNoteAction } from './lib/actions/restore-note';
import { trashNoteAction } from './lib/actions/trash-note';
import { updateCollectionAction } from './lib/actions/update-collection';
import { updateNoteAction } from './lib/actions/update-note';
import { memAuth } from './lib/auth';
import { newNoteTrigger } from './lib/triggers/new-note';
import { updatedNoteTrigger } from './lib/triggers/updated-note';

export const mem = createPiece({
  displayName: 'Mem',
  description: 'Capture and organize your thoughts using Mem.ai',
  auth: memAuth,
  logoUrl: 'https://cdn.activepieces.com/pieces/mem.png',
  authors: ['krushnarout', 'kishanprmr', 'OdaiAhmed99'],
  categories: [PieceCategory.PRODUCTIVITY],
  actions: [
    createMemAction,
    createNoteAction,
    getNoteAction,
    listNotesAction,
    searchNotesAction,
    findRelatedNotesAction,
    updateNoteAction,
    setNoteCreatedAtAction,
    trashNoteAction,
    restoreNoteAction,
    deleteNoteAction,
    createCollectionAction,
    getCollectionAction,
    listCollectionsAction,
    searchCollectionsAction,
    updateCollectionAction,
    addNoteToCollectionAction,
    removeNoteFromCollectionAction,
    moveNoteAction,
    deleteCollectionAction,
    createCustomApiCallAction({
      auth: memAuth,
      baseUrl: () => 'https://api.mem.ai/v2',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [newNoteTrigger, updatedNoteTrigger],
});
