import { createAction } from '@activepieces/pieces-framework';
import {
  imapAuth,
  performImapOperation,
  withMailboxLock,
  selectedMailbox,
  assertUidValidity,
  assertUidPlusForDelete,
  partitionExistingUids,
  parseUids,
  folderProp,
  uidsProp,
  uidValidityProp,
  ImapError,
} from '../common';
import { deleteEmailsOutputSchema } from '../output-schemas';

export const deleteEmails = createAction({
  auth: imapAuth,
  name: 'delete_emails',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Emails Permanently',
  description: 'Permanently deletes emails. This cannot be undone.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes (expunges) one or more emails by UID; this cannot be undone. Prefer trash_emails unless permanent removal is explicitly wanted, for example emptying mail that is already in Trash. On Gmail, deleting from a label folder only removes that label. Refuses on servers without UIDPLUS, where it would expunge other messages too. Not idempotent: a repeat call reports the UIDs as not found.',
    idempotent: false,
  },
  props: {
    folder: folderProp({
      displayName: 'Folder',
      description: 'Folder path from list_folders that contains the emails.',
    }),
    uids: uidsProp(),
    uid_validity: uidValidityProp(),
  },
  outputSchema: deleteEmailsOutputSchema,
  async run({ auth, propsValue }) {
    const uids = parseUids({ uids: propsValue.uids });
    const folder = propsValue.folder.trim();
    return performImapOperation(auth, async (client) => {
      assertUidPlusForDelete({ client });
      return withMailboxLock({
        client,
        folder,
        readOnly: false,
        run: async () => {
          assertUidValidity({ client, expected: propsValue.uid_validity });
          const mailbox = selectedMailbox({ client });
          const { found, notFound } = await partitionExistingUids({ client, uids });
          const range = found.join(',');
          const ok = await client.messageDelete(range, { uid: true });
          if (!ok) {
            throw new ImapError('The server refused to delete the emails.');
          }
          const remaining = await client.search({ uid: range }, { uid: true });
          if (remaining === false) {
            throw new ImapError('The delete ran, but the server rejected the follow-up check.');
          }
          const stillPresent = new Set(remaining);
          const deleted = found.filter((uid) => !stillPresent.has(uid));
          const notDeleted = found.filter((uid) => stillPresent.has(uid));
          if (deleted.length === 0) {
            throw new ImapError('The server did not delete any of the emails.');
          }
          return {
            folder: mailbox.path,
            deleted_uids: deleted,
            not_deleted_uids: notDeleted,
            not_found_uids: notFound,
          };
        },
      });
    });
  },
});
