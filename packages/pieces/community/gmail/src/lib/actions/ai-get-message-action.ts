import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../auth';
import { gmailGetEmailAction } from './get-mail-action';

export const gmailAiGetMessageAction = createAction({
  auth: gmailAuth,
  name: 'gmail_get_message',
  displayName: 'Get Message',
  description: 'Get a single email message by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single email by its Gmail message ID and returns its parsed contents, including headers, body, and decoded attachments (each attachment carries the attachmentId needed by Get Attachment). Use this to read the full details of a specific known message; obtain the message ID from Search Email. Idempotent: a read-only lookup that does not modify the mailbox.',
    idempotent: true,
  },
  props: gmailGetEmailAction.props,
  run: gmailGetEmailAction.run,
});
