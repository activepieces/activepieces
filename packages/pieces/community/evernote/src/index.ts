
    import { createCustomApiCallAction } from '@activepieces/pieces-common';
    import {
      OAuth2AuthorizationMethod,
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

    export const evernoteAuth = PieceAuth.OAuth2({
      authUrl: 'https://www.evernote.com/OAuth.action',
      tokenUrl: 'https://www.evernote.com/oauth',
      scope: ['basic'],
      extra: {
        owner: 'user',
      },
      authorizationMethod: OAuth2AuthorizationMethod.HEADER,
      required: true,
      description: `
        To obtain your OAuth2 credentials:
        
        1. Go to the Evernote Developer Portal (https://dev.evernote.com/)
        2. Log in or create an account
        3. Create a new application
        4. Configure the OAuth settings:
           - Add https://cloud.activepieces.com/redirect to the allowed redirect URIs
           - Select the required scopes for your integration
        5. Copy the Consumer Key and Consumer Secret
      `,
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
            Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
          }),
        }),
      ],
      triggers: [newNote, newNotebook, newTagAdded],
    });
    