import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { google } from 'googleapis';

export const gmailCreateLabelAction = createAction({
  auth: gmailAuth,
  name: 'gmail_create_label',
  displayName: 'Create Label',
  description: 'Create a new label in Gmail.',
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      description: 'The name of the new label.',
      required: true,
    }),
    label_list_visibility: Property.StaticDropdown({
      displayName: 'Label List Visibility',
      description: 'The visibility of the label in the label list.',
      required: false,
      defaultValue: 'labelShow',
      options: {
        disabled: false,
        options: [
          { label: 'Show', value: 'labelShow' },
          { label: 'Show if unread', value: 'labelShowIfUnread' },
          { label: 'Hide', value: 'labelHide' },
        ],
      },
    }),
    message_list_visibility: Property.StaticDropdown({
      displayName: 'Message List Visibility',
      description: 'The visibility of messages with this label in the message list.',
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
    const authClient = await createGoogleClient(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: context.propsValue.name,
        labelListVisibility: context.propsValue.label_list_visibility as string,
        messageListVisibility: context.propsValue.message_list_visibility as string,
      },
    });

    return response.data;
  },
});
