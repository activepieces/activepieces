import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailCreateLabelAction = createAction({
  auth: gmailAuth,
  name: 'create_label',
  description: 'Create a new user label in Gmail',
  displayName: 'Create Label',
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      description: 'The name of the label to create',
      required: true,
    }),
    label_list_visibility: Property.StaticDropdown({
      displayName: 'Label List Visibility',
      description: 'Whether the label is shown in the label list',
      required: false,
      defaultValue: 'labelShow',
      options: {
        disabled: false,
        options: [
          {
            label: 'Show',
            value: 'labelShow',
          },
          {
            label: 'Hide',
            value: 'labelHide',
          },
          {
            label: 'Show if Unread',
            value: 'labelShowIfUnread',
          },
        ],
      },
    }),
    message_list_visibility: Property.StaticDropdown({
      displayName: 'Message List Visibility',
      description:
        'Whether messages with this label are shown in the message list',
      required: false,
      defaultValue: 'show',
      options: {
        disabled: false,
        options: [
          {
            label: 'Show',
            value: 'show',
          },
          {
            label: 'Hide',
            value: 'hide',
          },
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
        labelListVisibility: context.propsValue.label_list_visibility as any,
        messageListVisibility: context.propsValue
          .message_list_visibility as any,
      },
    });

    return response.data;
  },
});
