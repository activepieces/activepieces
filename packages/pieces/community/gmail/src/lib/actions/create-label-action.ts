import { createAction, Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { gmailAuth, createGoogleClient } from '../auth';

export const gmailCreateLabelAction = createAction({
  auth: gmailAuth,
  name: 'create_label',
  displayName: 'Create Label',
  description: 'Create a new label in your Gmail account.',
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      description:
        'Use a slash (e.g. "Clients/VIP") to create the label as a nested sub-label.',
      required: true,
    }),
    label_list_visibility: Property.StaticDropdown<LabelListVisibility>({
      displayName: 'Show in Label List',
      description: 'Controls visibility of the label in the labels sidebar.',
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
    message_list_visibility: Property.StaticDropdown<MessageListVisibility>({
      displayName: 'Show in Message List',
      description: 'Controls whether messages under this label are visible.',
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
        labelListVisibility:
          context.propsValue.label_list_visibility ?? 'labelShow',
        messageListVisibility:
          context.propsValue.message_list_visibility ?? 'show',
      },
    });

    return response.data;
  },
});

type LabelListVisibility = 'labelShow' | 'labelShowIfUnread' | 'labelHide';
type MessageListVisibility = 'show' | 'hide';
