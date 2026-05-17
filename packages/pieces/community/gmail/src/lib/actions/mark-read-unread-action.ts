import { createAction, Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { gmailAuth, createGoogleClient } from '../auth';
import { GmailProps } from '../common/props';

export const gmailMarkReadUnreadAction = createAction({
  auth: gmailAuth,
  name: 'mark_read_unread',
  displayName: 'Mark as Read / Unread',
  description:
    'Mark an email as read or unread by toggling the UNREAD system label.',
  props: {
    message_id: GmailProps.message,
    state: Property.StaticDropdown<ReadState>({
      displayName: 'Mark As',
      required: true,
      defaultValue: 'read',
      options: {
        disabled: false,
        options: [
          { label: 'Read', value: 'read' },
          { label: 'Unread', value: 'unread' },
        ],
      },
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const isUnread = context.propsValue.state === 'unread';
    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.message_id,
      requestBody: {
        addLabelIds: isUnread ? ['UNREAD'] : [],
        removeLabelIds: isUnread ? [] : ['UNREAD'],
      },
    });

    return { state: context.propsValue.state, message: response.data };
  },
});

type ReadState = 'read' | 'unread';
