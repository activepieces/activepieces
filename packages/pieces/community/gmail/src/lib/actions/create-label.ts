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
      description: 'The name of the new label',
      required: true,
    }),
    label_list_visibility: Property.StaticDropdown({
      displayName: 'Show in Label List',
      description: 'Whether the label should appear in the label list',
      required: false,
      defaultValue: 'labelShow',
      options: {
        disabled: false,
        options: [
          { label: 'Show', value: 'labelShow' },
          { label: 'Show if Unread', value: 'labelShowIfUnread' },
          { label: 'Hide', value: 'labelHide' },
        ],
      },
    }),
    message_list_visibility: Property.StaticDropdown({
      displayName: 'Show in Message List',
      description: 'Whether the label should appear in the message list',
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
    background_color: Property.ShortText({
      displayName: 'Background Color',
      description: 'Background color in hex format (e.g., #16a765)',
      required: false,
    }),
    text_color: Property.ShortText({
      displayName: 'Text Color',
      description: 'Text color in hex format (e.g., #ffffff)',
      required: false,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const labelBody: any = {
      name: context.propsValue.name,
      labelListVisibility: context.propsValue.label_list_visibility,
      messageListVisibility: context.propsValue.message_list_visibility,
    };

    if (context.propsValue.background_color || context.propsValue.text_color) {
      labelBody.color = {
        backgroundColor: context.propsValue.background_color,
        textColor: context.propsValue.text_color,
      };
    }

    const response = await gmail.users.labels.create({
      userId: 'me',
      requestBody: labelBody,
    });

    return response.data;
  },
});
