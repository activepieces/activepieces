import { createAction, Property } from '@activepieces/pieces-framework';
import { imapAuth, setEmailReadStatus, mailboxDropdown } from '../common';

const props = {
  mailbox: mailboxDropdown({
    displayName: 'Parent Folder',
    description: 'Select the parent folder containing the email.',
    required: true,
  }),
  uid: Property.Number({
    displayName: 'Message UID',
    description: 'The UID of the email to mark.',
    required: true,
  }),
  markAsRead: Property.Checkbox({
    displayName: 'Mark as Read',
    description: 'Check to mark as read, uncheck to mark as unread.',
    defaultValue: true,
    required: false,
  }),
};

export const markEmailAsRead = createAction({
  auth: imapAuth,
  name: 'mark_email_read',
  displayName: 'Mark Email as Read/Unread',
  description: 'Sets the read status of an email',
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
