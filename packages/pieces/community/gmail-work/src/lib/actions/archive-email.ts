import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../index';
import { gmailCommon } from '../common/common';


export const archiveEmail = createAction({
  auth: gmailAuth,
  name: 'archive_email',
  displayName: 'Archive Email',
  description: 'Archive an email (move to All Mail)',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the email message to archive',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { messageId } = propsValue;
    
    return gmailCommon.makeRequest(
      auth.access_token,
      'POST',
      `/users/me/messages/${messageId}/modify`,
      {
        removeLabelIds: ['INBOX'],
      }
    );
  },
});
