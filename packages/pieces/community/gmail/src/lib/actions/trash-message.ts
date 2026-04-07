import { createAction, Property } from '@activepieces/pieces-framework';
import { GmailRequests } from '../common/data';
import { gmailAuth } from '../auth';

export const gmailTrashMessage = createAction({
  auth: gmailAuth,
  name: 'gmail_trash_message',
  description: 'Move an email to the Trash folder',
  displayName: 'Trash Email',
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the message to trash',
      required: true,
    }),
  },
  run: async ({ auth, propsValue: { message_id } }) => {
    return await GmailRequests.trashMessage({
      authentication: auth,
      message_id,
    });
  },
});
