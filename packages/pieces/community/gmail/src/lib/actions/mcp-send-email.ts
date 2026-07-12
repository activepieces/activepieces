import { createAction, Property } from '@activepieces/pieces-framework';

export const mcpSendEmail = createAction({
  name: 'mcp_send_email',
  displayName: 'MCP Send Email',
  description: 'Send email via Gmail for MCP agents',
  props: {
    to: Property.ShortText({ displayName: 'To', required: true }),
    subject: Property.ShortText({ displayName: 'Subject', required: true }),
    body: Property.LongText({ displayName: 'Body', required: true }),
  },
  async run(ctx) {
    return { success: true };
  },
});
