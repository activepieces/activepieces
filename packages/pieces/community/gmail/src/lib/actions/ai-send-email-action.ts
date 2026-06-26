import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../auth';
import { gmailSendEmailAction } from './send-email-action';

export const gmailAiSendEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_send_email',
  displayName: 'Send Email',
  description: 'Send an email through a Gmail account',
  audience: 'ai',
  aiMetadata: {
    description:
      'Composes and sends a new email from the connected Gmail account to one or more recipients, with optional CC/BCC, attachments, and a plain-text or HTML body. Use this to originate a fresh message; to answer an existing conversation prefer Reply to Thread, and to save an unsent message use Create Draft. Not idempotent: each call sends a separate message.',
    idempotent: false,
  },
  props: gmailSendEmailAction.props,
  run: gmailSendEmailAction.run,
});
