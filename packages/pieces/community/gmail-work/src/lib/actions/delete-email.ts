import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../index';
import { gmailCommon } from '../common/common';



export const deleteEmail = createAction({
  auth: gmailAuth,
  name: 'delete_email',
  displayName: 'Delete Email',
  description: 'Move an email to Trash',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the email message to delete',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { messageId } = propsValue;
    
    return gmailCommon.makeRequest(
      auth.access_token,
      'DELETE',
      `/users/me/messages/${messageId}`
    );
  },
});