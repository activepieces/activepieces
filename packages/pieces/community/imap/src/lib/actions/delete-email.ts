import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { imapAuth, deleteEmail as deleteImapEmail, mailboxDropdown } from '../common';
import { deleteEmailActionOutputSchema } from '../output-schemas';

const permanentDeletionNotice = `This deletes the email for good and can't be undone. To keep it recoverable, use **Move Email** to send it to Trash instead.`;

const props = {
  permanentDeletionNotice: Property.MarkDown({
    value: permanentDeletionNotice,
    variant: MarkdownVariant.WARNING,
  }),
  mailbox: mailboxDropdown({
    displayName: 'Folder',
    description: 'Folder the email is in.',
    required: true,
  }),
  uid: Property.Number({
    displayName: 'Message UID',
    description: "Map uid from the New Email trigger. It's only valid in its folder.",
    required: true,
  }),
};

export const deleteEmail = createAction({
  auth: imapAuth,
  name: 'delete_email',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Email',
  description: 'Permanently delete an email.',
  outputSchema: deleteEmailActionOutputSchema,
  audience: 'human',
  aiMetadata: { description: 'Permanently deletes an email (by message UID) from an IMAP folder; this cannot be undone and does not move the message to Trash (use Move Email for that). Use only when irreversible removal is intended. Requires the folder and the UID; destructive and not idempotent since a repeat call cannot find the already-deleted message.', idempotent: false },
  props,
  async run({ auth, propsValue }) {
    const { uid, mailbox } = propsValue;
    return await deleteImapEmail({ auth, uid, mailbox: mailbox! });
  },
});
