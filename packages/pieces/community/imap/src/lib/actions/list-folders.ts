import { createAction, Property } from '@activepieces/pieces-framework';
import { imapAuth, performImapOperation, flagsToArray } from '../common';
import { listFoldersOutputSchema } from '../output-schemas';

export const listFolders = createAction({
  auth: imapAuth,
  name: 'list_folders',
  classification: 'SEARCH',
  displayName: 'List Folders',
  description: 'Lists every folder in the mailbox.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists all IMAP folders with their full path, delimiter, parent and detected special-use role (Trash, Drafts, Sent, Junk, Archive, All). Call first to learn exact folder paths for every other IMAP tool. special_use_source "name" means the role was guessed from the folder name. Set include_counts only when counts are needed: it costs one STATUS per folder. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    include_counts: Property.Checkbox({
      displayName: 'Include Message Counts',
      description:
        'Also return the total and unread message count of each folder. Slower on accounts with many folders.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: listFoldersOutputSchema,
  async run({ auth, propsValue }) {
    const includeCounts = propsValue.include_counts === true;
    return performImapOperation(auth, async (client) => {
      const entries = await client.list(
        includeCounts ? { statusQuery: { messages: true, unseen: true } } : {}
      );
      const folders = entries.map((entry) => {
        const status = entry.status;
        const hasCounts =
          includeCounts && status !== undefined && typeof status.messages === 'number';
        return {
          path: entry.path,
          name: entry.name,
          delimiter: entry.delimiter,
          parent_path: entry.parentPath,
          special_use: entry.specialUse ?? null,
          special_use_source: entry.specialUseSource ?? null,
          flags: flagsToArray(entry.flags),
          subscribed: entry.subscribed,
          ...(hasCounts ? { messages: status.messages, unseen: status.unseen ?? null } : {}),
        };
      });
      return { folders, count: folders.length };
    });
  },
});
