import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailCreateLabelAction = createAction({
  auth: gmailAuth,
  name: 'create_label',
  description: 'Create a new label in Gmail',
  displayName: 'Create Label',
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      description: 'The name of the label to create',
      required: true,
    }),
    labelListVisibility: Property.StaticDropdown({
      displayName: 'Label List Visibility',
      description: 'The visibility of the label in the label list in the Gmail web interface',
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
            label: 'Show if unread',
            value: 'labelShowIfUnread',
          },
          {
            label: 'Hide',
            value: 'labelHide',
          },
        ],
      },
    }),
    messageListVisibility: Property.StaticDropdown({
      displayName: 'Message List Visibility',
      description: 'The visibility of messages with this label in the message list in the Gmail web interface',
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
        labelListVisibility: context.propsValue.labelListVisibility,
        messageListVisibility: context.propsValue.messageListVisibility,
      },
    });

    return response.data;
  },
});
