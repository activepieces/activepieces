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
import { archiveEmailsOutputSchema } from '../output-schemas';

export const archiveEmails = createAction({
  auth: imapAuth,
  name: 'archive_emails',
  classification: 'WRITE',
  displayName: 'Archive Emails',
  description: 'Moves emails to the Archive folder.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves one or more emails by UID out of a folder into the mailbox Archive folder, found automatically (on Gmail, All Mail). When special_use_source is "name", the Archive folder was guessed from its name. Fails, naming move_emails, if no Archive folder exists. uid_validity is required and must come from the search_emails call that produced these UIDs; a mismatch fails the call so stale UIDs cannot archive the wrong emails. Not idempotent: archived UIDs are gone from the source.',
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
  outputSchema: archiveEmailsOutputSchema,
  async run({ auth, propsValue }) {
    const uids = parseUids({ uids: propsValue.uids });
    const sourceFolder = propsValue.folder.trim();
    return performImapOperation(auth, async (client) => {
      const archive = await resolveSpecialFolder({ client, role: 'archive' });
      if (!archive) {
        throw new ImapError(
          'No Archive folder was found on this server. Use move_emails with an explicit target folder.'
        );
      }
      if (samePath({ a: sourceFolder, b: archive.path })) {
        throw new ImapError('These emails are already in the Archive folder.');
      }
      const result = await transferInFolder({
        client,
        sourceFolder,
        targetFolder: archive.path,
        uids,
        uidValidity: propsValue.uid_validity,
        mode: 'move',
      });
      return {
        ...result,
        destination_folder: archive.path,
        special_use_source: archive.special_use_source,
      };
    });
  },
});
