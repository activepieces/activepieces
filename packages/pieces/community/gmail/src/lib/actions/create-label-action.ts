import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';

export const gmailCreateLabelAction = createAction({
  auth: gmailAuth,
  name: 'create_label',
  displayName: 'Create Label',
  description: 'Create a new label in Gmail.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new user label in Gmail with the given name and optional visibility settings. Use this before applying a label that does not yet exist. Not idempotent: creating a label whose name already exists fails with a conflict error.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      description: 'The name of the new label to create.',
      required: true,
    }),
    label_list_visibility: Property.StaticDropdown({
      displayName: 'Label List Visibility',
      description: 'Whether the label is shown in the label list.',
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
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: context.propsValue.name,
        labelListVisibility: context.propsValue.label_list_visibility,
        messageListVisibility: context.propsValue.message_list_visibility,
      },
    });

    return response.data;
  },
});
