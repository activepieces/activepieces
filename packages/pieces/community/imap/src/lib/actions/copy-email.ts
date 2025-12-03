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
  props,
  async run({ auth, propsValue }) {
    const { uid, sourceMailbox, targetMailbox } = propsValue;
    return await copyImapEmail({ auth, uid, sourceMailbox: sourceMailbox!, targetMailbox: targetMailbox! });
  },
});
