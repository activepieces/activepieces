import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { helpAction } from './lib/actions/help.action';
import { jmapRequestAction } from './lib/actions/jmap-request.action';
import { listInboxAction } from './lib/actions/list-inbox.action';
import { registerAction } from './lib/actions/register.action';
import { replyAction } from './lib/actions/reply.action';
import { sendMailAction } from './lib/actions/send-mail.action';
import { atomicmailAuth } from './lib/auth';
import { newEmailTrigger } from './lib/triggers/new-email.trigger';

export const atomicmail = createPiece({
  displayName: 'Atomic Mail',
  description:
    'Give AI agents and automations a real email inbox — register an @atomicmail.ai address, read and send mail, reply to threads, and run advanced JMAP workflows.',
  auth: atomicmailAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/atomicmail.png',
  categories: [PieceCategory.COMMUNICATION, PieceCategory.DEVELOPER_TOOLS],
  authors: ['atomicmail'],
  actions: [
    registerAction,
    helpAction,
    listInboxAction,
    sendMailAction,
    replyAction,
    jmapRequestAction,
  ],
  triggers: [newEmailTrigger],
});

export { atomicmailAuth };
