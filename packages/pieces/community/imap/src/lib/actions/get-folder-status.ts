import { createAction } from '@activepieces/pieces-framework';
import {
  imapAuth,
  performImapOperation,
  bigintToString,
  folderProp,
  ImapError,
} from '../common';
import { getFolderStatusOutputSchema } from '../output-schemas';

export const getFolderStatus = createAction({
  auth: imapAuth,
  name: 'get_folder_status',
  classification: 'READ',
  displayName: 'Get Folder Status',
  description: 'Gets message counts and UID information for a folder.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the total, unread and recent message counts plus uid_next and uid_validity of one IMAP folder without opening it. Use for a quick unread count or to check whether UIDs from an earlier search are still valid; use search_emails to list the messages themselves. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    folder: folderProp({
      displayName: 'Folder',
      description: 'Folder path from list_folders.',
    }),
  },
  outputSchema: getFolderStatusOutputSchema,
  async run({ auth, propsValue }) {
    const folder = propsValue.folder.trim();
    return performImapOperation(auth, async (client) => {
      const status = await client.status(folder, {
        messages: true,
        unseen: true,
        recent: true,
        uidNext: true,
        uidValidity: true,
        highestModseq: true,
      });
      if (!status) {
        throw new ImapError(`Could not read the status of "${folder}".`);
      }
      const highestModseq = bigintToString(status.highestModseq);
      return {
        path: status.path,
        messages: status.messages ?? null,
        unseen: status.unseen ?? null,
        recent: status.recent ?? null,
        uid_next: status.uidNext ?? null,
        uid_validity: bigintToString(status.uidValidity) ?? null,
        ...(highestModseq ? { highest_modseq: highestModseq } : {}),
      };
    });
  },
});
