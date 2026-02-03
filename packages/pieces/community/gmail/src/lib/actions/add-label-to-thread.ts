import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailRequests } from '../common/data';
import { GmailProps } from '../common/props';

export const gmailAddLabelToThreadAction = createAction({
  auth: gmailAuth,
  name: 'add_label_to_thread',
  displayName: 'Add Label to Thread',
  description: 'Add a label to a specific thread.',
  props: {
    thread_id: GmailProps.thread,
    label_id: Property.Dropdown({
      auth: gmailAuth,
      displayName: 'Label',
      description: 'The label to add to the thread.',
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
    const { thread_id, label_id } = context.propsValue;
    return await GmailRequests.addLabelToThread(context.auth, thread_id, label_id);
  },
});
