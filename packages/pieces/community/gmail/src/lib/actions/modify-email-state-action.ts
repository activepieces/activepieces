import { createAction, Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { gmailAuth, createGoogleClient } from '../auth';
import { GmailProps } from '../common/props';

export const gmailModifyEmailStateAction = createAction({
  auth: gmailAuth,
  name: 'modify_email_state',
  displayName: 'Archive / Trash / Delete Email',
  description:
    'Archive (remove INBOX label), move to Trash, restore from Trash, or permanently delete an email.',
  props: {
    message_id: GmailProps.message,
    operation: Property.StaticDropdown<EmailStateOperation>({
      displayName: 'Operation',
      required: true,
      defaultValue: 'archive',
      options: {
        disabled: false,
        options: [
          { label: 'Archive (remove from Inbox)', value: 'archive' },
          { label: 'Move to Trash', value: 'trash' },
          { label: 'Restore from Trash', value: 'untrash' },
          {
            label: 'Permanently Delete (cannot be undone)',
            value: 'delete',
          },
        ],
      },
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });
    const messageId = context.propsValue.message_id;
    const operation = context.propsValue.operation;

    if (operation === 'archive') {
      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: { removeLabelIds: ['INBOX'] },
      });
      return { operation, message: response.data };
    }

    if (operation === 'trash') {
      const response = await gmail.users.messages.trash({
        userId: 'me',
        id: messageId,
      });
      return { operation, message: response.data };
    }

    if (operation === 'untrash') {
      const response = await gmail.users.messages.untrash({
        userId: 'me',
        id: messageId,
      });
      return { operation, message: response.data };
    }

    await gmail.users.messages.delete({
      userId: 'me',
      id: messageId,
    });
    return { operation, deletedMessageId: messageId };
  },
});

type EmailStateOperation = 'archive' | 'trash' | 'untrash' | 'delete';
