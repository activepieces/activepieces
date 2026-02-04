import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailRequests } from '../common/data';
import { GmailProps } from '../common/props';

export const gmailAddLabelToMessageAction = createAction({
  auth: gmailAuth,
  name: 'add_label_to_message',
  displayName: 'Add Label to Message',
  description: 'Add a label to a specific message.',
  props: {
    message_id: GmailProps.message,
    label_id: Property.Dropdown({
      auth: gmailAuth,
      displayName: 'Label',
      description: 'The label to add to the message.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }
        const response = await GmailRequests.getLabels(auth);
        return {
          disabled: false,
          options: response.body.labels.map((label) => ({
            label: label.name,
            value: label.id,
          })),
        };
      },
    }),
  },
  async run(context) {
    const { message_id, label_id } = context.propsValue;
    return await GmailRequests.addLabelToMessage(context.auth, message_id, label_id);
  },
});
