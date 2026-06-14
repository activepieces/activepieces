import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { gmailMcpAuth } from '../common/auth';
import { gmailRequest } from '../common/gmail-api';

export const addLabel = createAction({
  auth: gmailMcpAuth,
  name: 'gmail_mcp_add_label',
  displayName: 'Add Label to Email',
  description: 'Add a label to a Gmail message',
  props: {
    messageId: Property.ShortText({ displayName: 'Message ID', required: true }),
    labelId: Property.ShortText({ displayName: 'Label ID', required: true }),
  },
  async run(context) {
    const { messageId, labelId } = context.propsValue;
    return await gmailRequest(context.auth.access_token, HttpMethod.POST, `/messages/${messageId}/modify`, { addLabelIds: [labelId] });
  },
});
