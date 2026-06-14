import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { gmailMcpAuth } from '../common/auth';
import { gmailRequest } from '../common/gmail-api';

export const archiveEmail = createAction({
  auth: gmailMcpAuth,
  name: 'gmail_mcp_archive_email',
  displayName: 'Archive Email',
  description: 'Archive an email by removing the INBOX label',
  props: {
    messageId: Property.ShortText({ displayName: 'Message ID', required: true }),
  },
  async run(context) {
    return await gmailRequest(context.auth.access_token, HttpMethod.POST, `/messages/${context.propsValue.messageId}/modify`, { removeLabelIds: ['INBOX'] });
  },
});
