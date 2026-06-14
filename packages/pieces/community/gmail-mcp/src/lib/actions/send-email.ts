import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { gmailMcpAuth } from '../common/auth';
import { gmailRequest, encodeEmail } from '../common/gmail-api';

export const sendEmail = createAction({
  auth: gmailMcpAuth,
  name: 'gmail_mcp_send_email',
  displayName: 'Send Email',
  description: 'Send an email via Gmail MCP',
  props: {
    to: Property.ShortText({ displayName: 'To', required: true }),
    subject: Property.ShortText({ displayName: 'Subject', required: true }),
    body: Property.LongText({ displayName: 'Body', required: true }),
    cc: Property.ShortText({ displayName: 'CC', required: false }),
    bcc: Property.ShortText({ displayName: 'BCC', required: false }),
    isHtml: Property.Checkbox({ displayName: 'Send as HTML', required: false, defaultValue: false }),
  },
  async run(context) {
    const { to, subject, body, cc, bcc, isHtml } = context.propsValue;
    const raw = encodeEmail({ to, subject, body, cc: cc ?? undefined, bcc: bcc ?? undefined, isHtml: isHtml ?? false });
    return await gmailRequest(context.auth.access_token, HttpMethod.POST, '/messages/send', { raw });
  },
});
