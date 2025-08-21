import { createPiece } from "@activepieces/pieces-framework";
import { evernoteCommon } from "./lib/common/common";
import { createNote } from "./lib/actions/create-note";
import { updateNote } from "./lib/actions/update-note";
import { appendToNote } from "./lib/actions/append-to-note";
import { tagNote } from "./lib/actions/tag-note";
import { createNotebook } from "./lib/actions/create-notebook";
import { createTag } from "./lib/actions/create-tag";
import { findNote } from "./lib/actions/find-note";
import { findTag } from "./lib/actions/find-tag";
import { newNoteTrigger } from "./lib/triggers/new-note";
import { newNotebookTrigger } from "./lib/triggers/new-notebook";
import { newTagAddedToNoteTrigger } from "./lib/triggers/new-tag-added-to-note";

export const evernote = createPiece({
  displayName: "Evernote",
  description: "An app for note taking, organizing, and task management.",
  auth: evernoteCommon.auth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/evernote.png",
  authors: ['activepieces-community'],
  actions: [
    createNote,
    updateNote,
    appendToNote,
    tagNote,
    createNotebook,
    createTag,
    findNote,
    findTag,
  ],
  triggers: [
    newNoteTrigger,
    newNotebookTrigger,
    newTagAddedToNoteTrigger,
  ],
});