import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailClient } from '../common/client';

export const addLabelToEmail = createAction({
  name: 'add-label-to-email',
  displayName: 'Add Label To Email',
  description: 'Adds an existing Gmail label to a specific email.',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'ID of the email to modify',
      required: true,
    }),
    labelId: Property.ShortText({
      displayName: 'Label ID',
      description: 'ID of the label to add to the email',
      required: true,
    }),
  },
  async run(context) {
    const gmail = await gmailClient(context.auth);

    const res = await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.messageId,
      requestBody: {
        addLabelIds: [context.propsValue.labelId],
      },
    });

    return res.data;
  },
});
