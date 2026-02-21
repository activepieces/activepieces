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
      description: 'The display name of the label',
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
    const { name, labelListVisibility, messageListVisibility } = context.propsValue;

    const authClient = new OAuth2Client();
    authClient.setCredentials({
      access_token: context.auth.access_token,
    });

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    try {
      const response = await gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: name,
          labelListVisibility: labelListVisibility || 'labelShow',
          messageListVisibility: messageListVisibility || 'show',
        },
      });

      return {
        success: true,
        label: {
          id: response.data.id,
          name: response.data.name,
          type: response.data.type,
          labelListVisibility: response.data.labelListVisibility,
          messageListVisibility: response.data.messageListVisibility,
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to create label: ${error.message}`);
    }
  },
});
