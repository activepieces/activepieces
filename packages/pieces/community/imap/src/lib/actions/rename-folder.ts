import { createAction, Property } from '@activepieces/pieces-framework';
import {
  imapAuth,
  performImapOperation,
  ImapError,
  ImapMailboxNotFoundError,
  isInbox,
  assertHeaderSafe,
} from '../common';
import { renameFolderOutputSchema } from '../output-schemas';

export const renameFolder = createAction({
  auth: imapAuth,
  name: 'rename_folder',
  classification: 'WRITE',
  displayName: 'Rename Folder',
  description: 'Renames or moves a folder to a new path.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Renames an IMAP folder, or moves it under another parent, by giving its full new path. INBOX and folders the server flags as special-use (Trash, Sent, Drafts and so on) cannot be renamed. Not idempotent: a repeat call fails because the old path no longer exists.',
    idempotent: false,
  },
  props: {
    folder: Property.ShortText({
      displayName: 'Folder',
      description: 'Current folder path from list_folders.',
      required: true,
    }),
    new_path: Property.ShortText({
      displayName: 'New Path',
      description:
        'Full new path, using the folder separator from list_folders for nesting (for example "Projects/2026").',
      required: true,
    }),
  },
  outputSchema: renameFolderOutputSchema,
  async run({ auth, propsValue }) {
    const folder = propsValue.folder.trim();
    const newPath = propsValue.new_path.trim();
    assertHeaderSafe({ field: 'New path', value: newPath });
    if (!folder || !newPath) {
      throw new ImapError('Both the folder and the new path are required.');
    }
    if (isInbox({ path: folder }) || isInbox({ path: newPath })) {
      throw new ImapError('INBOX cannot be renamed, and no folder can be renamed to INBOX.');
    }
    if (folder === newPath) {
      throw new ImapError('The new path is the same as the current path.');
    }
    return performImapOperation(auth, async (client) => {
      const folders = await client.list();
      const current = folders.find((entry) => entry.path === folder);
      if (!current) {
        throw new ImapMailboxNotFoundError();
      }
      if (current.specialUse && current.specialUseSource === 'extension') {
        throw new ImapError(
          `"${folder}" is the server's ${current.specialUse} folder and cannot be renamed.`
        );
      }
      if (folders.some((entry) => entry.path === newPath)) {
        throw new ImapError(`A folder named "${newPath}" already exists.`);
      }
      const result = await client.mailboxRename(folder, newPath);
      return { path: result.path, new_path: result.newPath };
    });
  },
});
