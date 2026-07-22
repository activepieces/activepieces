import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../auth';
import { gmailReplyToEmailAction } from './reply-to-email-action';
import { gmailAiReplyToThreadActionOutputSchema } from '../output-schemas';

export const gmailAiReplyToThreadAction = createAction({
  auth: gmailAuth,
  name: 'gmail_reply_to_thread',
  displayName: 'Reply to Thread',
  description: 'Reply to an existing email thread.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sends a reply to an existing email, preserving the thread and subject and addressing the original sender (reply) or all participants (reply all). Use this to respond within a known conversation; requires the Gmail message ID of the email being answered (obtain it from Search Email or Get Thread). Not idempotent: each call sends a new reply into the thread.',
    idempotent: false,
  },
  outputSchema: gmailAiReplyToThreadActionOutputSchema,
  props: gmailReplyToEmailAction.props,
  run: gmailReplyToEmailAction.run,
});
