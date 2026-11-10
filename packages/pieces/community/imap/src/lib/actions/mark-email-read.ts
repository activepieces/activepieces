import { createAction, Property } from '@activepieces/pieces-framework';
import { imapAuth, setEmailReadStatus, mailboxDropdown } from '../common';
import { markEmailReadActionOutputSchema } from '../output-schemas';

const props = {
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
  markAsRead: Property.Checkbox({
    displayName: 'Mark as Read',
    description: 'Turn off to mark the email as unread instead.',
    defaultValue: true,
    required: false,
  }),
};

export const markEmailAsRead = createAction({
  auth: imapAuth,
  name: 'mark_email_read',
  classification: 'WRITE',
  displayName: 'Mark Email as Read/Unread',
  description: 'Mark an email as read or unread.',
  outputSchema: markEmailReadActionOutputSchema,
  audience: 'human',
  aiMetadata: { description: 'Sets the read/unread (\\Seen) flag on a specific email in an IMAP mailbox, identified by its message UID. Use to mark a message as read after processing it or to flag one as unread. Requires the exact mailbox folder and UID; this is idempotent since it sets the flag to the chosen target state.', idempotent: true },
  props,
  async run({ auth, propsValue }) {
    const { uid, markAsRead, mailbox } = propsValue;
    return await setEmailReadStatus({
      auth,
      uid,
      mailbox: mailbox!,
      markAsRead: !!markAsRead,
    });
  },
});
