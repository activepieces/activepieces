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
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes an email (by message UID) from an IMAP folder; this cannot be undone and does not move the message to Trash (use Move Email for that). Use only when irreversible removal is intended. Requires the folder and the UID; destructive and not idempotent since a repeat call cannot find the already-deleted message.', idempotent: false },
  props,
  async run({ auth, propsValue }) {
    const { uid, mailbox } = propsValue;
    return await deleteImapEmail({ auth, uid, mailbox: mailbox! });
  },
});
