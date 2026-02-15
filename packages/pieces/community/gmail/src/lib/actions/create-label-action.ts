import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailCreateLabelAction = createAction({
  auth: gmailAuth,
  name: 'create_label',
  displayName: 'Create Label',
  description: 'Create a new label in Gmail',
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      description: 'The name of the new label to create',
      required: true,
    }),
    messageListVisibility: Property.StaticDropdown({
      displayName: 'Message List Visibility',
      description: 'Whether to show the label in the message list',
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
    labelListVisibility: Property.StaticDropdown({
      displayName: 'Label List Visibility',
      description: 'Whether to show the label in the label list',
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
            label: 'Show if Unread',
            value: 'labelShowIfUnread',
          },
          {
            label: 'Hide',
            value: 'labelHide',
          },
        ],
      },
    }),
    textColor: Property.ShortText({
      displayName: 'Text Color',
      description: 'Text color for the label (hex format, e.g. #ffffff)',
      required: false,
    }),
    backgroundColor: Property.ShortText({
      displayName: 'Background Color',
      description: 'Background color for the label (hex format, e.g. #000000)',
      required: false,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const labelData: any = {
      name: context.propsValue.name,
      messageListVisibility: context.propsValue.messageListVisibility || 'show',
      labelListVisibility: context.propsValue.labelListVisibility || 'labelShow',
    };

    // Add color if provided
    if (context.propsValue.textColor || context.propsValue.backgroundColor) {
      labelData.color = {};
      if (context.propsValue.textColor) {
        labelData.color.textColor = context.propsValue.textColor;
      }
      if (context.propsValue.backgroundColor) {
        labelData.color.backgroundColor = context.propsValue.backgroundColor;
      }
    }

    try {
      const response = await gmail.users.labels.create({
        userId: 'me',
        requestBody: labelData,
      });

      return {
        success: true,
        label: response.data,
      };
    } catch (error) {
      throw new Error(`Failed to create label: ${error.message}`);
    }
  },
});