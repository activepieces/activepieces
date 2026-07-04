import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';

export const gmailModifyLabelAction = createAction({
  auth: gmailAuth,
  name: 'gmail_modify_label',
  displayName: 'Add/Remove Label',
  description: 'Add or remove a label from an email.',
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the email message to modify.',
      required: true,
    }),
    action: Property.StaticDropdown({
      displayName: 'Action',
      description: 'Whether to add or remove the label.',
      required: true,
      options: {
        options: [
          { label: 'Add Label', value: 'add' },
          { label: 'Remove Label', value: 'remove' },
        ],
      },
    }),
    label_id: Property.ShortText({
      displayName: 'Label ID',
      description: 'The Gmail label ID to add or remove (e.g., IMPORTANT, STARRED, or a custom label ID).',
      required: true,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const isAdd = context.propsValue.action === 'add';

    await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.message_id,
      requestBody: {
        addLabelIds: isAdd ? [context.propsValue.label_id] : [],
        removeLabelIds: isAdd ? [] : [context.propsValue.label_id],
      },
    });

    return {
      success: true,
      messageId: context.propsValue.message_id,
      action: isAdd ? 'label_added' : 'label_removed',
      labelId: context.propsValue.label_id,
    };
  },
});
