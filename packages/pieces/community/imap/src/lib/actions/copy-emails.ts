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
import { copyEmailsOutputSchema } from '../output-schemas';

export const copyEmails = createAction({
  auth: imapAuth,
  name: 'copy_emails',
  classification: 'WRITE',
  displayName: 'Copy Emails',
  description: 'Copies emails into another folder, keeping the originals.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Copies one or more emails by UID from a source folder into an existing target folder, leaving the originals in place. Use move_emails to relocate instead of duplicate. UIDs that no longer exist are reported, not failed. Not idempotent: every call adds another copy.',
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
      description: 'Existing folder path from list_folders to copy the emails into.',
      required: true,
    }),
    uid_validity: uidValidityProp(),
  },
  outputSchema: copyEmailsOutputSchema,
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
        mode: 'copy',
      });
      return { ...result, target_folder: targetFolder };
    });
  },
});
