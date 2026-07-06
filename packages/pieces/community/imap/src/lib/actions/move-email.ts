import { createAction, Property } from '@activepieces/pieces-framework';
import { imapAuth, mailboxDropdown, moveEmail as moveImapEmail } from '../common';

const props = {
  sourceMailbox: mailboxDropdown({
    displayName: 'Source Folder',
    description: 'Folder to move the email from.',
    required: true,
  }),
  uid: Property.Number({
    displayName: 'Message UID',
    description: 'The UID of the email to move.',
    required: true,
  }),
  targetMailbox: mailboxDropdown({
    displayName: 'Target Folder',
    description: 'Destination folder for the email.',
    required: true,
  }),
};

export const moveEmail = createAction({
  auth: imapAuth,
  name: 'move_email',
  displayName: 'Move Email',
  description: 'Move an email to another mailbox',
  audience: 'both',
  aiMetadata: { description: 'Moves an email (by message UID) from a source IMAP folder to a target folder, removing it from the source. Use to file, archive, or send a message to a Trash folder. Requires the source folder, target folder, and the UID; not idempotent since after the move the message no longer exists at the source UID and a repeat call cannot find it.', idempotent: false },
  props,
  async run({ auth, propsValue }) {
    const { uid, sourceMailbox, targetMailbox } = propsValue;
    return await moveImapEmail({ auth, uid, sourceMailbox: sourceMailbox!, targetMailbox: targetMailbox! });
  },
});
