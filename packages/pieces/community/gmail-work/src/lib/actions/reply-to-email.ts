import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../index';
import { gmailCommon } from '../common/common';

export const replyToEmail = createAction({
  auth: gmailAuth,
  name: 'reply_to_email',
  displayName: 'Reply to Email',
  description: 'Reply to an email within an existing thread',
  props: {
    threadId: Property.ShortText({
      displayName: 'Thread ID',
      description: 'The ID of the thread to reply to',
      required: true,
    }),
    to: Property.Array({
      displayName: 'To',
      description: 'Email addresses to send the reply to',
      required: true,
    }),
    cc: Property.Array({
      displayName: 'CC',
      description: 'Email addresses to CC',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      description: 'Email addresses to BCC',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Reply subject (will be prefixed with Re: if not already)',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Email body content (HTML supported)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { threadId, to, cc, bcc, subject, body } = propsValue;
    
    // Prepare email message
    const emailLines = [
      `To: ${Array.isArray(to) ? to.join(', ') : to}`,
    ];
    
    if (cc && cc.length > 0) {
      emailLines.push(`Cc: ${Array.isArray(cc) ? cc.join(', ') : cc}`);
    }
    
    if (bcc && bcc.length > 0) {
      emailLines.push(`Bcc: ${Array.isArray(bcc) ? bcc.join(', ') : bcc}`);
    }
    
    const finalSubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
    emailLines.push(`Subject: ${finalSubject}`);
    emailLines.push('');
    emailLines.push(body);
    
    const rawMessage = gmailCommon.encodeBase64Url(emailLines.join('\n'));
    
    return gmailCommon.makeRequest(
      auth.access_token,
      'POST',
      '/users/me/messages/send',
      {
        raw: rawMessage,
        threadId: threadId,
      }
    );
  },
});