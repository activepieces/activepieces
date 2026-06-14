import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { gmailMcpAuth } from '../common/auth';
import { gmailRequest } from '../common/gmail-api';

export const readEmail = createAction({
  auth: gmailMcpAuth,
  name: 'gmail_mcp_read_email',
  displayName: 'Read Email',
  description: 'Read a specific email by message ID',
  props: {
    messageId: Property.ShortText({ displayName: 'Message ID', required: true }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      required: false,
      defaultValue: 'full',
      options: {
        options: [
          { label: 'Full', value: 'full' },
          { label: 'Metadata', value: 'metadata' },
          { label: 'Minimal', value: 'minimal' },
          { label: 'Raw', value: 'raw' },
        ],
      },
    }),
  },
  async run(context) {
    const { messageId, format } = context.propsValue;
    return await gmailRequest(context.auth.access_token, HttpMethod.GET, `/messages/${messageId}?format=${format ?? 'full'}`);
  },
});
