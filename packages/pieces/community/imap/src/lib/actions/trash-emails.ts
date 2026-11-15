import { createAction } from '@activepieces/pieces-framework';
import {
  imapAuth,
  performImapOperation,
  transferInFolder,
  resolveSpecialFolder,
  parseUids,
  samePath,
  folderProp,
  uidsProp,
  uidValidityProp,
  ImapError,
} from '../common';
import { trashEmailsOutputSchema } from '../output-schemas';

export const trashEmails = createAction({
  auth: imapAuth,
  name: 'trash_emails',
  classification: 'WRITE',
  displayName: 'Move Emails to Trash',
  description: 'Moves emails to the Trash folder.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves one or more emails by UID to the mailbox Trash folder, found automatically. This is the recoverable way to remove mail; prefer it over delete_emails. When special_use_source is "name", the Trash folder was guessed from its name. Fails, naming move_emails, if no Trash folder exists; use delete_emails for mail already in Trash. uid_validity is required and must come from the search_emails call that produced these UIDs; a mismatch fails the call so stale UIDs cannot trash the wrong emails. Not idempotent: trashed UIDs are gone from the source.',
    idempotent: false,
  },
  props: {
    folder: folderProp({
      displayName: 'Folder',
      description: 'Folder path from list_folders that contains the emails.',
    }),
    uids: uidsProp(),
    uid_validity: uidValidityProp({ required: true }),
  },
  outputSchema: trashEmailsOutputSchema,
  async run({ auth, propsValue }) {
    const uids = parseUids({ uids: propsValue.uids });
    const sourceFolder = propsValue.folder.trim();
    return performImapOperation(auth, async (client) => {
      const trash = await resolveSpecialFolder({ client, role: 'trash' });
      if (!trash) {
        throw new ImapError(
          'No Trash folder was found on this server. Use move_emails with an explicit target folder.'
        );
      }
      if (samePath({ a: sourceFolder, b: trash.path })) {
        throw new ImapError(
          'These emails are already in the Trash folder. Use delete_emails to remove them permanently.'
        );
      }
      const result = await transferInFolder({
        client,
        sourceFolder,
        targetFolder: trash.path,
        uids,
        uidValidity: propsValue.uid_validity,
        mode: 'move',
      });
      return {
        ...result,
        destination_folder: trash.path,
        special_use_source: trash.special_use_source,
      };
    });
  },
});
