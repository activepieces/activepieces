import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailCreateLabelAction = createAction({
  auth: gmailAuth,
  name: 'gmail_create_label',
  displayName: 'Create Label',
  description: 'Create a new user label in Gmail.',
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      description: 'The name of the label to create.',
      required: true,
    }),
    label_list_visibility: Property.StaticDropdown({
      displayName: 'Show in Label List',
      description: 'Whether this label should appear in the label list.',
      required: false,
      defaultValue: 'labelShow',
      options: {
        disabled: false,
        options: [
          { label: 'Show', value: 'labelShow' },
          { label: 'Hide', value: 'labelHide' },
          { label: 'Show if Unread', value: 'labelShowIfUnread' },
        ],
      },
    }),
    message_list_visibility: Property.StaticDropdown({
      displayName: 'Show in Message List',
      description: 'Whether messages with this label show in the message list.',
      required: false,
      defaultValue: 'show',
      options: {
        disabled: false,
        options: [
          { label: 'Show', value: 'show' },
          { label: 'Hide', value: 'hide' },
        ],
      },
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: context.propsValue.name,
        labelListVisibility: context.propsValue.label_list_visibility || 'labelShow',
        messageListVisibility: context.propsValue.message_list_visibility || 'show',
      },
    });

    return response.data;
  },
});
