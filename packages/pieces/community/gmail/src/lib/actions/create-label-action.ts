import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import {
  getGmailApiErrorCode,
  getGmailApiErrorMessage,
} from '../common/errors';
import { gmailCreateLabelActionOutputSchema } from '../output-schemas';

export const gmailCreateLabelAction = createAction({
  auth: gmailAuth,
  name: 'create_label',
  classification: 'WRITE',
  displayName: 'Create Label',
  description: 'Create a new user label in Gmail.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new user-defined Gmail label with optional sidebar and message-list visibility settings. Use Add Label to Email or Remove Label from Email to apply or strip it afterwards. Not idempotent: creating a label whose name already exists fails with a conflict error.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      description:
        'Name for the new label. Use "/" to nest it under an existing label (e.g. "Clients/Acme").',
      required: true,
    }),
    label_list_visibility: Property.StaticDropdown({
      displayName: 'Label List Visibility',
      description:
        'Whether the label appears in the label list in the Gmail sidebar.',
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
        'Whether messages with this label appear in the message list.',
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
  outputSchema: gmailCreateLabelActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
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
    } catch (error) {
      const errorCode = getGmailApiErrorCode(error);
      if (errorCode === 403) {
        throw new Error(
          'Insufficient permissions to create labels. Reconnect your Gmail account so the gmail.labels scope is granted.'
        );
      } else if (errorCode === 409) {
        throw new Error(
          `A label named "${context.propsValue.name}" already exists.`
        );
      } else if (errorCode === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(
        `Failed to create label: ${getGmailApiErrorMessage(error)}`
      );
    }
  },
});
