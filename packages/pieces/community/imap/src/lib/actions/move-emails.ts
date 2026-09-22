import { createAction, Property } from '@activepieces/pieces-framework';
import {
  imapAuth,
  performImapOperation,
  transferInFolder,
  parseUids,
  folderProp,
  uidsProp,
  uidValidityProp,
} from '../common';
import { moveEmailsOutputSchema } from '../output-schemas';

export const moveEmails = createAction({
  auth: imapAuth,
  name: 'move_emails',
  classification: 'WRITE',
  displayName: 'Move Emails',
  description: 'Moves emails from one folder to another.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves one or more emails by UID from a source folder to an existing target folder. Use trash_emails or archive_emails when the destination is the Trash or Archive folder, and create_folder first if the target does not exist. UIDs that no longer exist are reported, not failed. Refuses on servers that support neither MOVE nor UIDPLUS. Not idempotent: moved UIDs are gone from the source.',
    idempotent: false,
  },
  props: {
    source_folder: folderProp({
      displayName: 'Source Folder',
      description: 'Folder path from list_folders that contains the emails.',
    }),
    uids: uidsProp(),
    target_folder: Property.ShortText({
      displayName: 'Target Folder',
      description: 'Existing folder path from list_folders to move the emails into.',
      required: true,
    }),
    uid_validity: uidValidityProp(),
  },
  outputSchema: moveEmailsOutputSchema,
  async run({ auth, propsValue }) {
    const uids = parseUids({ uids: propsValue.uids });
    const sourceFolder = propsValue.source_folder.trim();
    const targetFolder = propsValue.target_folder.trim();
    return performImapOperation(auth, async (client) => {
      const result = await transferInFolder({
        client,
        sourceFolder,
        targetFolder,
        uids,
        uidValidity: propsValue.uid_validity,
        mode: 'move',
      });
      return { ...result, target_folder: targetFolder };
    });
  },
});
