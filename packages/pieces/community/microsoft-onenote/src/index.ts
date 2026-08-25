import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { getGraphBaseUrl } from './lib/common/microsoft-cloud';
import { appendNote } from './lib/actions/append-note';
import { createImageNote } from './lib/actions/create-image-note';
import { createNoteInSection } from './lib/actions/create-note-in-section';
import { createNotebook } from './lib/actions/create-notebook';
import { createPage } from './lib/actions/create-page';
import { createSection } from './lib/actions/create-section';
import { oneNoteAuth } from './lib/auth';
import { newNoteInSectionTrigger } from './lib/triggers/new-note-in-section';

export const microsoftOnenote = createPiece({
  displayName: 'Microsoft OneNote',
  description:
    'Microsoft OneNote is a note-taking app that allows you to create, edit, and share notes with others.',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: oneNoteAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-onenote.png',
  authors: ['fortunamide', 'onyedikachi-david'],
  actions: [
    createNotebook,
    createSection,
    createNoteInSection,
    createPage,
    createImageNote,
    appendNote,
    createCustomApiCallAction({
      auth: oneNoteAuth,
      baseUrl: (auth) => {
        const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
        return getGraphBaseUrl(cloud) + '/v1.0/';
      },
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [newNoteInSectionTrigger],
});
