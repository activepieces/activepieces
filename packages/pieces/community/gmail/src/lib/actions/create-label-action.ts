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
      description: 'Whether the label is shown in the label list.',
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
      description:
        'Whether messages with this label are shown in the message list.',
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
      description: 'Hex color code for the label background (e.g. #16a765).',
      required: false,
    }),
    text_color: Property.ShortText({
      displayName: 'Text Color',
      description: 'Hex color code for the label text (e.g. #ffffff).',
      required: false,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const requestBody: {
      name: string;
      labelListVisibility: string;
      messageListVisibility: string;
      color?: { textColor: string; backgroundColor: string };
    } = {
      name: context.propsValue.name,
      labelListVisibility:
        context.propsValue.label_list_visibility ?? 'labelShow',
      messageListVisibility:
        context.propsValue.message_list_visibility ?? 'show',
    };

    if (context.propsValue.background_color && context.propsValue.text_color) {
      requestBody.color = {
        backgroundColor: context.propsValue.background_color,
        textColor: context.propsValue.text_color,
      };
    }

    try {
      const response = await gmail.users.labels.create({
        userId: 'me',
        requestBody,
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 409) {
        throw new Error(
          `A label with the name "${context.propsValue.name}" already exists.`
        );
      }
      throw error;
    }
  },
});
