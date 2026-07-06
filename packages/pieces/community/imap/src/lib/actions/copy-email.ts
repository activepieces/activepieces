import { createAction, Property } from '@activepieces/pieces-framework';
import {
  imapAuth,
  mailboxDropdown,
  copyEmail as copyImapEmail,
} from '../common';

const props = {
  sourceMailbox: mailboxDropdown({
    displayName: 'Source Folder',
    description: 'Folder to copy the email from.',
    required: true,
  }),
  uid: Property.Number({
    displayName: 'Message UID',
    description: 'The UID of the email to copy.',
    required: true,
  }),
  targetMailbox: mailboxDropdown({
    displayName: 'Target Folder',
    description: 'Folder to copy the email to.',
    required: true,
  }),
};

export const copyEmail = createAction({
  auth: imapAuth,
  name: 'copy_email',
  displayName: 'Copy Email',
  description: 'Copy an email to another mailbox',
  audience: 'both',
  aiMetadata: { description: 'Copies an email (by message UID) from a source IMAP folder into a target folder, leaving the original in place. Use to duplicate a message into another mailbox without removing it from the source. Requires the source folder, target folder, and the UID; not idempotent since each call appends another copy with a new UID.', idempotent: false },
  props,
  async run({ auth, propsValue }) {
    const { uid, sourceMailbox, targetMailbox } = propsValue;
    return await copyImapEmail({ auth, uid, sourceMailbox: sourceMailbox!, targetMailbox: targetMailbox! });
  },
});
