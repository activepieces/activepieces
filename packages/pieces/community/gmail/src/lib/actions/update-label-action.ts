import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { gmailUpdateLabelActionOutputSchema } from '../output-schemas';

export const gmailUpdateLabelAction = createAction({
  auth: gmailAuth,
  name: 'gmail_update_label',
  classification: 'WRITE',
  displayName: 'Update Label',
  description: 'Rename, recolor, or change the visibility of a user label.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates a user label (rename, change list visibility, or recolor). Only system labels like INBOX or UNREAD cannot be updated. Any field left unset here is left unchanged on the label. Obtain the label ID from List Labels or Get or Create Label. Idempotent: true — re-applying the same field values converges on the same label state.',
    idempotent: true,
  },
  props: {
    label_id: Property.ShortText({
      displayName: 'Label ID',
      description:
        'The ID of the user label to update (obtain from List Labels).',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'Leave empty to keep the current name.',
      required: false,
    }),
    label_list_visibility: Property.StaticDropdown({
      displayName: 'Label List Visibility',
      description: 'Leave unselected to keep the current setting.',
      required: false,
      options: {
        options: [
          { label: 'Show', value: 'labelShow' },
          { label: 'Show if unread', value: 'labelShowIfUnread' },
          { label: 'Hide', value: 'labelHide' },
        ],
      },
    }),
    message_list_visibility: Property.StaticDropdown({
      displayName: 'Message List Visibility',
      description: 'Leave unselected to keep the current setting.',
      required: false,
      options: {
        options: [
          { label: 'Show', value: 'show' },
          { label: 'Hide', value: 'hide' },
        ],
      },
    }),
    background_color: Property.ShortText({
      displayName: 'Background Color (hex)',
      description: 'Leave empty to keep the current background color.',
      required: false,
    }),
    text_color: Property.ShortText({
      displayName: 'Text Color (hex)',
      description: 'Leave empty to keep the current text color.',
      required: false,
    }),
  },
  outputSchema: gmailUpdateLabelActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });
    const { label_id, name, label_list_visibility, message_list_visibility } =
      context.propsValue;
    const backgroundColor = context.propsValue.background_color;
    const textColor = context.propsValue.text_color;

    try {
      let color: { textColor?: string; backgroundColor?: string } | undefined;
      if (backgroundColor !== undefined || textColor !== undefined) {
        const current = await gmail.users.labels.get({
          userId: 'me',
          id: label_id,
        });
        color = {
          backgroundColor:
            backgroundColor ?? current.data.color?.backgroundColor ?? undefined,
          textColor: textColor ?? current.data.color?.textColor ?? undefined,
        };
      }

      const response = await gmail.users.labels.patch({
        userId: 'me',
        id: label_id,
        requestBody: {
          ...(name !== undefined ? { name } : {}),
          ...(label_list_visibility !== undefined
            ? { labelListVisibility: label_list_visibility }
            : {}),
          ...(message_list_visibility !== undefined
            ? { messageListVisibility: message_list_visibility }
            : {}),
          ...(color !== undefined ? { color } : {}),
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to update this label. Ensure the gmail.modify scope is granted, and that the label is a user label (system labels like INBOX cannot be updated).'
        );
      } else if (error.code === 404) {
        throw new Error(
          `Label not found: "${label_id}". Use List Labels to find a valid label ID.`
        );
      }
      throw new Error(`Failed to update label: ${error.message}`);
    }
  },
});
