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
  props,
  async run({ auth, propsValue }) {
    const { uid, sourceMailbox, targetMailbox } = propsValue;
    return await moveImapEmail({ auth, uid, sourceMailbox: sourceMailbox!, targetMailbox: targetMailbox! });
  },
});
