import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { google } from 'googleapis';

export const gmailCreateLabelAction = createAction({
  auth: gmailAuth,
  name: 'create_label',
  displayName: 'Create Label',
  description: 'Create a new user label in Gmail.',
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      description: 'Name for the new label.',
      required: true,
    }),
    label_list_visibility: Property.StaticDropdown({
      displayName: 'Label List Visibility',
      description: 'Visibility of the label in the label list.',
      required: false,
      defaultValue: 'labelShow',
      options: {
        disabled: false,
        options: [
          { label: 'Show in label list', value: 'labelShow' },
          { label: 'Show if unread', value: 'labelShowIfUnread' },
          { label: 'Hide from label list', value: 'labelHide' },
        ],
      },
    }),
    message_list_visibility: Property.StaticDropdown({
      displayName: 'Message List Visibility',
      description: 'Visibility of messages with this label.',
      required: false,
      defaultValue: 'show',
      options: {
        disabled: false,
        options: [
          { label: 'Show in message list', value: 'show' },
          { label: 'Hide from message list', value: 'hide' },
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
        messageListVisibility:
          context.propsValue.message_list_visibility as string,
      },
    });

    return response.data;
  },
});
