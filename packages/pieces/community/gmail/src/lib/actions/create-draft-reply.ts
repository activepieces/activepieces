import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../index';
import { gmailCommon } from '../common/common';



export const createDraftReply = createAction({
  auth: gmailAuth,
  name: 'create_draft_reply',
  displayName: 'Create Draft Reply',
  description: 'Create a draft reply within an existing thread',
  props: {
    threadId: Property.ShortText({
      displayName: 'Thread ID',
      description: 'The ID of the thread to create a draft reply for',
      required: true,
    }),
    to: Property.Array({
      displayName: 'To',
      description: 'Email addresses for the draft reply',
      required: true,
    }),
    cc: Property.Array({
      displayName: 'CC',
      description: 'Email addresses to CC',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Draft subject',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Draft body content (HTML supported)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { threadId, to, cc, subject, body } = propsValue;
    
    const emailLines = [
      `To: ${Array.isArray(to) ? to.join(', ') : to}`,
    ];
    
    if (cc && cc.length > 0) {
      emailLines.push(`Cc: ${Array.isArray(cc) ? cc.join(', ') : cc}`);
    }
    
    const finalSubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
    emailLines.push(`Subject: ${finalSubject}`);
    emailLines.push('');
    emailLines.push(body);
    
    const rawMessage = gmailCommon.encodeBase64Url(emailLines.join('\n'));
    
    return gmailCommon.makeRequest(
      auth.access_token,
      'POST',
      '/users/me/drafts',
      {
        message: {
          raw: rawMessage,
          threadId: threadId,
        },
      }
    );
  },
});
