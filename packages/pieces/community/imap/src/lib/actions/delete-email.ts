import { createAction, Property } from '@activepieces/pieces-framework';
import { imapAuth, deleteEmail as deleteImapEmail, mailboxDropdown } from '../common';

const permanentDeletionNotice = `
**Permanent Deletion:**

This action permanently deletes the email. This action cannot be undone. To move an email to the Trash folder, use the Move Email action instead.
`;

const props = {
  mailbox: mailboxDropdown({
    displayName: 'Parent Folder',
    description: 'Folder to delete the email from.',
    required: true,
  }),
  uid: Property.Number({
    displayName: 'Message UID',
    description: 'The UID of the email to delete.',
    required: true,
  }),
  permanentDeletionNotice: Property.MarkDown({
    value: permanentDeletionNotice,
  }),
};

export const deleteEmail = createAction({
  auth: imapAuth,
  name: 'delete_email',
  displayName: 'Delete Email',
  description: 'Permanently delete an email',
  props,
  async run({ auth, propsValue }) {
    const { uid, mailbox } = propsValue;
    return await deleteImapEmail({ auth, uid, mailbox: mailbox! });
  },
});
