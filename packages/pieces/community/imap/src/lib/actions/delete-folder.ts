import { createAction, Property } from '@activepieces/pieces-framework';
import {
  imapAuth,
  performImapOperation,
  ImapError,
  ImapMailboxNotFoundError,
  isInbox,
} from '../common';
import { deleteFolderOutputSchema } from '../output-schemas';

export const deleteFolder = createAction({
  auth: imapAuth,
  name: 'delete_folder',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Folder',
  description: 'Permanently deletes a folder and the emails in it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes an IMAP folder. On most servers every message inside is destroyed; on Gmail only the label is removed. Refuses INBOX, folders that have child folders, and any folder with a special-use role (Trash, Sent, Drafts, Junk, Archive, All), including roles guessed from the folder name. Not idempotent: a repeat call fails because the folder is gone.',
    idempotent: false,
  },
  props: {
    folder: Property.ShortText({
      displayName: 'Folder',
      description: 'Folder path from list_folders.',
      required: true,
    }),
  },
  outputSchema: deleteFolderOutputSchema,
  async run({ auth, propsValue }) {
    const folder = propsValue.folder.trim();
    if (!folder || isInbox({ path: folder })) {
      throw new ImapError('INBOX cannot be deleted.');
    }
    return performImapOperation(auth, async (client) => {
      const folders = await client.list();
      const current = folders.find((entry) => entry.path === folder);
      if (!current) {
        throw new ImapMailboxNotFoundError();
      }
      if (current.specialUse) {
        const guessed =
          current.specialUseSource === 'name'
            ? ' (the role was guessed from the folder name)'
            : '';
        throw new ImapError(
          `"${folder}" is a ${current.specialUse} folder${guessed} and will not be deleted.`
        );
      }
      const children = folders.filter((entry) => entry.parentPath === folder);
      if (children.length > 0) {
        throw new ImapError(
          `"${folder}" has ${children.length} child folder(s); delete or move them first.`
        );
      }
      const result = await client.mailboxDelete(folder);
      return { path: result.path, deleted: true };
    });
  },
});
