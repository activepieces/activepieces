
    import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
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

export const evernoteAuth = PieceAuth.CustomAuth({
  description: 'Evernote API Key',
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Key (Consumer Key)',
      description: 'Your Evernote API key from the developer portal',
      required: true,
    }),
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      description: 'OAuth1 access token obtained through the authorization flow',
      required: true,
    }),
    noteStoreUrl: Property.ShortText({
      displayName: 'Note Store URL',
      description: 'Your personal note store URL (e.g., https://www.evernote.com/shard/s1/notestore)',
      required: true,
      defaultValue: 'https://www.evernote.com/shard/s1/notestore',
    }),
  },
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
    