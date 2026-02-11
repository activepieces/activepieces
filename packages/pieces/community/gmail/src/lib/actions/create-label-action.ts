import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailCreateLabelAction = createAction({
  auth: gmailAuth,
  name: 'gmail_create_label',
  displayName: 'Create Label',
  description: 'Create a new label',
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      required: true,
    }),
    labelListVisibility: Property.StaticDropdown({
        displayName: 'Label List Visibility',
        required: false,
        defaultValue: 'labelShow',
        options: {
            disabled: false,
            options: [
                { label: 'Show', value: 'labelShow' },
                { label: 'Show if Unread', value: 'labelShowIfUnread' },
                { label: 'Hide', value: 'labelHide' },
            ]
        }
    }),
    messageListVisibility: Property.StaticDropdown({
        displayName: 'Message List Visibility',
        required: false,
        defaultValue: 'show',
        options: {
            disabled: false,
            options: [
                { label: 'Show', value: 'show' },
                { label: 'Hide', value: 'hide' },
            ]
        }
    }),
    backgroundColor: Property.ShortText({
        displayName: 'Background Color',
        description: 'The background color represented as hex string #RRGGBB (e.g #000000)',
        required: false,
    }),
    textColor: Property.ShortText({
        displayName: 'Text Color',
        description: 'The text color of the label, represented as hex string. This field is required in order to set the background color.',
        required: false,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const { name, labelListVisibility, messageListVisibility, backgroundColor, textColor } = context.propsValue;

    const requestBody: any = {
        name,
        labelListVisibility,
        messageListVisibility,
    };

    if (backgroundColor && textColor) {
        requestBody.color = {
            backgroundColor,
            textColor
        }
    }

    const response = await gmail.users.labels.create({
        userId: 'me',
        requestBody
    });

    return response.data;
  },
});
