
    import { createPiece, PieceAuth, OAuth2AuthorizationMethod } from "@activepieces/pieces-framework";
    import { createNote } from './lib/actions/create-note';
    import { createTag } from './lib/actions/create-tag';
    import { createNotebook } from './lib/actions/create-notebook';
    import { updateNote } from './lib/actions/update-note';
    import { tagNote } from './lib/actions/tag-note';
    import { appendToNote } from './lib/actions/append-to-note';
    import { findATag } from './lib/actions/find-a-tag';
    import { findANote } from './lib/actions/find-a-note';
    import { newNote } from './lib/triggers/new-note';
import { newNotebook } from './lib/triggers/new-notebook';
import { newTagAddedToNote } from './lib/triggers/new-tag-added-to-note';

    export const evernoteAuth = PieceAuth.OAuth2({
  authUrl: 'https://www.evernote.com/OAuth.action',
  tokenUrl: 'https://www.evernote.com/oauth',
  scope: ['basic'],
  extra: {
    owner: 'user',
  },
  authorizationMethod: OAuth2AuthorizationMethod.HEADER,
  required: true,
});

    export const evernote = createPiece({
      displayName: "Evernote",
      auth: evernoteAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/evernote.png",
      authors: [],
      actions: [createNote, createTag, createNotebook, updateNote, tagNote, appendToNote, findATag, findANote],
      triggers: [newNote, newNotebook, newTagAddedToNote],
    });
    